import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateRentalDto } from './dto/create-rental.dto';
import { UpdateRentalDto } from './dto/update-rental.dto';

const rentalInclude = {
  rentalUsage: true,
  client: true,
} satisfies Prisma.RentalInclude;

@Injectable()
export class RentalsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertClientInCompany(clientId: string, companyId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, companyId, deletedAt: null },
    });
    if (!client) {
      throw new BadRequestException(
        'Client not found or does not belong to your company',
      );
    }
    return client;
  }

  private async assertRentalUsageExists(rentalUsageId: string) {
    const u = await this.prisma.rentalUsage.findUnique({
      where: { id: rentalUsageId },
    });
    if (!u) {
      throw new BadRequestException('Invalid rental usage');
    }
    return u;
  }

  async create(dto: CreateRentalDto, companyId: string) {
    await this.assertClientInCompany(dto.clientId, companyId);
    await this.assertRentalUsageExists(dto.rentalUsageId);

    return this.prisma.rental.create({
      data: {
        clientId: dto.clientId,
        rentalUsageId: dto.rentalUsageId,
        name: dto.name,
        address: dto.address,
        owner: dto.owner,
        useTax: dto.useTax ?? true,
        value: new Prisma.Decimal(String(dto.value)),
        meta: (dto.meta ?? {}) as Prisma.InputJsonValue,
      },
      include: rentalInclude,
    });
  }

  async findAll(companyId: string, clientId?: string) {
    return this.prisma.rental.findMany({
      where: {
        deletedAt: null,
        client: {
          companyId,
          deletedAt: null,
          ...(clientId ? { id: clientId } : {}),
        },
      },
      include: rentalInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const row = await this.prisma.rental.findFirst({
      where: {
        id,
        deletedAt: null,
        client: { companyId, deletedAt: null },
      },
      include: rentalInclude,
    });
    if (!row) {
      throw new NotFoundException('Rental not found');
    }
    return row;
  }

  async update(id: string, dto: UpdateRentalDto, companyId: string) {
    await this.findOne(id, companyId);
    if (dto.rentalUsageId) {
      await this.assertRentalUsageExists(dto.rentalUsageId);
    }
    return this.prisma.rental.update({
      where: { id },
      data: {
        ...(dto.rentalUsageId !== undefined
          ? { rentalUsageId: dto.rentalUsageId }
          : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
        ...(dto.owner !== undefined ? { owner: dto.owner } : {}),
        ...(dto.useTax !== undefined ? { useTax: dto.useTax } : {}),
        ...(dto.value !== undefined
          ? { value: new Prisma.Decimal(String(dto.value)) }
          : {}),
        ...(dto.meta !== undefined
          ? { meta: dto.meta as Prisma.InputJsonValue }
          : {}),
      },
      include: rentalInclude,
    });
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.rental.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: rentalInclude,
    });
  }
}
