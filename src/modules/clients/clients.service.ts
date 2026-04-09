import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

const paymentMethodsWithDetails = {
  include: { paymentMethod: true },
};

const clientInclude = {
  clientType: true,
  clientFlag: true,
  country: true,
  region: true,
  currency: true,
  legalForm: true,
  paymentMethods: paymentMethodsWithDetails,
} satisfies Prisma.ClientInclude;

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClientDto, companyId: string) {
    const { paymentMethodIds, ...rest } = dto;
    return this.prisma.client.create({
      data: {
        ...rest,
        companyId,
        paymentMethods: paymentMethodIds?.length
          ? {
              create: paymentMethodIds.map((id) => ({
                paymentMethod: { connect: { id } },
              })),
            }
          : undefined,
      },
      include: clientInclude,
    });
  }

  async findAll(companyId: string) {
    return this.prisma.client.findMany({
      where: { companyId },
      include: clientInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, companyId, deletedAt: null },
      include: clientInclude,
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async update(id: string, dto: UpdateClientDto, companyId: string) {
    await this.findOne(id, companyId);
    const { paymentMethodIds, ...rest } = dto;

    const data: Prisma.ClientUpdateInput = { ...rest };
    if (paymentMethodIds !== undefined) {
      data.paymentMethods = {
        deleteMany: {},
        create: [...new Set(paymentMethodIds)].map((pmId) => ({
          paymentMethod: { connect: { id: pmId } },
        })),
      };
    }

    return this.prisma.client.update({
      where: { id },
      data,
      include: clientInclude,
    });
  }

  async remove(id: string, companyId: string) {
    const client = await this.findOne(id, companyId);
    return this.prisma.client.update({
      where: { id: client.id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }
}
