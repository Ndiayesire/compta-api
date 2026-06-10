import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateOpRoyaltyDto } from './dto/create-op-royalty.dto';
import { UpdateOpRoyaltyDto } from './dto/update-op-royalty.dto';

const royaltyInclude = {
  tier: true,
} satisfies Prisma.OpRoyaltyInclude;

@Injectable()
export class OpRoyaltiesService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertTier(id: string) {
    const row = await this.prisma.tier.findFirst({
      where: { id, deletedAt: null },
    });
    if (!row) {
      throw new BadRequestException('Invalid tier');
    }
    return row;
  }

  async create(dto: CreateOpRoyaltyDto) {
    await this.assertTier(dto.tierId);
    return this.prisma.opRoyalty.create({
      data: {
        tierId: dto.tierId,
        code: dto.code,
        date: new Date(dto.date),
        month: dto.month,
        year: dto.year,
        base: new Prisma.Decimal(String(dto.base)),
        rate: new Prisma.Decimal(String(dto.rate)),
        amount: new Prisma.Decimal(String(dto.amount)),
      },
      include: royaltyInclude,
    });
  }

  async findAll(tierId?: string) {
    return this.prisma.opRoyalty.findMany({
      where: {
        deletedAt: null,
        ...(tierId ? { tierId } : {}),
      },
      include: royaltyInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.opRoyalty.findFirst({
      where: { id, deletedAt: null },
      include: royaltyInclude,
    });
    if (!row) {
      throw new NotFoundException('Op royalty not found');
    }
    return row;
  }

  async update(id: string, dto: UpdateOpRoyaltyDto) {
    await this.findOne(id);
    if (dto.tierId) await this.assertTier(dto.tierId);
    return this.prisma.opRoyalty.update({
      where: { id },
      data: {
        ...(dto.tierId !== undefined ? { tierId: dto.tierId } : {}),
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.date !== undefined ? { date: new Date(dto.date) } : {}),
        ...(dto.month !== undefined ? { month: dto.month } : {}),
        ...(dto.year !== undefined ? { year: dto.year } : {}),
        ...(dto.base !== undefined ? { base: new Prisma.Decimal(String(dto.base)) } : {}),
        ...(dto.rate !== undefined ? { rate: new Prisma.Decimal(String(dto.rate)) } : {}),
        ...(dto.amount !== undefined ? { amount: new Prisma.Decimal(String(dto.amount)) } : {}),
      },
      include: royaltyInclude,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.opRoyalty.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
