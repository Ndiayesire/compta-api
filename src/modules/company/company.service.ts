import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

const paymentMethodsWithDetails = {
  include: { paymentMethod: true },
};

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCompanyDto) {
    const { paymentMethodIds, user, ...rest } = dto;

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { email: user.email } });
      if (existing) {
        throw new ConflictException(`Email "${user.email}" already exists`);
      }

      const company = await tx.company.create({
        data: {
          ...rest,
          paymentMethods: paymentMethodIds?.length
            ? {
                create: paymentMethodIds.map((id) => ({
                  paymentMethod: { connect: { id } },
                })),
              }
            : undefined,
        },
        include: {
          country: true,
          region: true,
          paymentMethods: paymentMethodsWithDetails,
          currency: true,
          legalForm: true,
        },
      });

      const { password, roleId, ...userFields } = user;
      const hashedPassword = await bcrypt.hash(password, 10);

      const createdUser = await tx.user.create({
        data: {
          ...userFields,
          password: hashedPassword,
          company: { connect: { id: company.id } },
          ...(roleId ? { role: { connect: { id: roleId } } } : {}),
        },
        include: {
          role: { include: { permissions: { include: { permission: true } } } },
          company: true,
        },
      });

      const { password: _omit, ...userSafe } = createdUser;
      return { company };
    });
  }

  async findAll() {
    return this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        country: true,
        region: true,
        paymentMethods: paymentMethodsWithDetails,
        currency: true,
      },
    });
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        country: true,
        region: true,
        paymentMethods: paymentMethodsWithDetails,
        currency: true,
      },
    });
    if (!company) throw new NotFoundException(`Company ${id} not found`);
    return company;
  }

  async update(id: string, dto: UpdateCompanyDto) {
    await this.findOne(id);
    const { paymentMethodIds, user: _user, ...rest } = dto;

    const data: Parameters<typeof this.prisma.company.update>[0]['data'] = {
      ...rest,
      ...(paymentMethodIds !== undefined && {
        paymentMethods: {
          deleteMany: {},
          create: [...new Set(paymentMethodIds)].map((pmId) => ({
            paymentMethod: { connect: { id: pmId } },
          })),
        },
      }),
    };

    return this.prisma.company.update({
      where: { id },
      data,
      include: {
        country: true,
        region: true,
        paymentMethods: paymentMethodsWithDetails,
        currency: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.company.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
