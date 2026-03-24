import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCompanyDto) {
    const { paymentMethodIds, ...rest } = dto;
    return this.prisma.company.create({
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
      include: { country: true, region: true, paymentMethods: true },
    });
  }

  async findAll() {
    return this.prisma.company.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      include: { country: true, region: true, paymentMethods: true },
    });
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: { country: true, region: true, paymentMethods: true },
    });
    if (!company) throw new NotFoundException(`Company ${id} not found`);
    return company;
  }

  async update(id: string, dto: UpdateCompanyDto) {
    await this.findOne(id);
    const { paymentMethodIds, ...rest } = dto;
    return this.prisma.company.update({
      where: { id },
      data: rest,
      include: { country: true, region: true, paymentMethods: true },
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