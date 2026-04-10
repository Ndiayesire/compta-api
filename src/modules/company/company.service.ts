import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

const companyInclude = {
  country: true,
  region: true,
  legalForm: true,
  user: true,
} as const;

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCompanyDto) {
    const { user, ...companyRest } = dto;

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { email: user.email } });
      if (existing) {
        throw new ConflictException(`Email "${user.email}" already exists`);
      }

      if (!user.roleId) {
        throw new ConflictException('User roleId is required');
      }

      const hashedPassword = await bcrypt.hash(user.password, 10);

      const createdUser = await tx.user.create({
        data: {
          email: user.email,
          password: hashedPassword,
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
          phone: user.phone ?? '',
          address: user.address ?? '',
          avatar: user.avatar ?? '',
          countryId: user.countryId,
          regionId: user.regionId,
          languageId: user.languageId,
          genderId: user.genderId,
          isActive: user.isActive ?? true,
          roleId: user.roleId,
        },
      });

      const company = await tx.company.create({
        data: {
          userId: createdUser.id,
          name: companyRest.name,
          email: companyRest.email,
          phone: companyRest.phone,
          address: companyRest.address,
          ninea: companyRest.ninea,
          useTva: companyRest.useTva ?? true,
          reference: companyRest.reference,
          legalFormId: companyRest.legalFormId,
          countryId: companyRest.countryId,
          regionId: companyRest.regionId,
          meta: (companyRest.meta ?? {}) as Prisma.InputJsonValue,
        },
        include: companyInclude,
      });

      return { company };
    });
  }

  async findAll() {
    return this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      include: companyInclude,
    });
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: companyInclude,
    });
    if (!company) throw new NotFoundException(`Company ${id} not found`);
    return company;
  }

  async update(id: string, dto: UpdateCompanyDto) {
    await this.findOne(id);
    const { user: _user, meta, countryId, regionId, legalFormId, ...scalar } = dto;

    const data: Prisma.CompanyUpdateInput = {
      ...scalar,
      ...(meta !== undefined ? { meta: meta as Prisma.InputJsonValue } : {}),
      ...(countryId !== undefined ? { country: { connect: { id: countryId } } } : {}),
      ...(regionId !== undefined ? { region: { connect: { id: regionId } } } : {}),
      ...(legalFormId !== undefined ? { legalForm: { connect: { id: legalFormId } } } : {}),
    };

    return this.prisma.company.update({
      where: { id },
      data,
      include: companyInclude,
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
