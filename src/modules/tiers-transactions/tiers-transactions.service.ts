import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTiersTransactionDto } from './dto/create-tiers-transaction.dto';
import { UpdateTiersTransactionDto } from './dto/update-tiers-transaction.dto';

const tiersTransactionInclude = {
  tier: {
    include: {
      client: { select: { id: true, name: true, companyId: true } },
    },
  },
} satisfies Prisma.TiersTransactionInclude;

@Injectable()
export class TiersTransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertTierInCompany(tierId: string, companyId: string) {
    const tier = await this.prisma.tier.findFirst({
      where: {
        id: tierId,
        deletedAt: null,
        client: { companyId, deletedAt: null },
      },
    });
    if (!tier) {
      throw new BadRequestException(
        'Tier not found or does not belong to your company',
      );
    }
    return tier;
  }

  async create(dto: CreateTiersTransactionDto, companyId: string) {
    await this.assertTierInCompany(dto.tierId, companyId);
    return this.prisma.tiersTransaction.create({
      data: {
        tierId: dto.tierId,
        transactionId: dto.transactionId,
        net: dto.net,
        tax: dto.tax,
        total: dto.total,
        date: new Date(dto.date),
      },
      include: tiersTransactionInclude,
    });
  }

  async findAll(companyId: string, tierId?: string) {
    return this.prisma.tiersTransaction.findMany({
      where: {
        deletedAt: null,
        tier: {
          client: { companyId, deletedAt: null },
          deletedAt: null,
          ...(tierId ? { id: tierId } : {}),
        },
      },
      include: tiersTransactionInclude,
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const row = await this.prisma.tiersTransaction.findFirst({
      where: {
        id,
        deletedAt: null,
        tier: {
          client: { companyId, deletedAt: null },
          deletedAt: null,
        },
      },
      include: tiersTransactionInclude,
    });
    if (!row) {
      throw new NotFoundException('Tiers transaction not found');
    }
    return row;
  }

  async update(
    id: string,
    dto: UpdateTiersTransactionDto,
    companyId: string,
  ) {
    await this.findOne(id, companyId);
    if (dto.tierId) {
      await this.assertTierInCompany(dto.tierId, companyId);
    }
    return this.prisma.tiersTransaction.update({
      where: { id },
      data: {
        ...(dto.tierId !== undefined ? { tierId: dto.tierId } : {}),
        ...(dto.transactionId !== undefined
          ? { transactionId: dto.transactionId }
          : {}),
        ...(dto.net !== undefined ? { net: dto.net } : {}),
        ...(dto.tax !== undefined ? { tax: dto.tax } : {}),
        ...(dto.total !== undefined ? { total: dto.total } : {}),
        ...(dto.date !== undefined ? { date: new Date(dto.date) } : {}),
      },
      include: tiersTransactionInclude,
    });
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.tiersTransaction.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
