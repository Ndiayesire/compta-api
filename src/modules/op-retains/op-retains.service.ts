import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateOpRetainDto } from './dto/create-op-retain.dto';
import { UpdateOpRetainDto } from './dto/update-op-retain.dto';

const retainInclude = {
  tier: true,
} satisfies Prisma.OpRetainInclude;

@Injectable()
export class OpRetainsService {
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

  async create(dto: CreateOpRetainDto) {
    await this.assertTier(dto.tierId);
    return this.prisma.opRetain.create({
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
      include: retainInclude,
    });
  }

  async findAll(tierId?: string) {
    return this.prisma.opRetain.findMany({
      where: {
        deletedAt: null,
        ...(tierId ? { tierId } : {}),
      },
      include: retainInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.opRetain.findFirst({
      where: { id, deletedAt: null },
      include: retainInclude,
    });
    if (!row) {
      throw new NotFoundException('Op retain not found');
    }
    return row;
  }

  async update(id: string, dto: UpdateOpRetainDto) {
    await this.findOne(id);
    if (dto.tierId) await this.assertTier(dto.tierId);
    return this.prisma.opRetain.update({
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
      include: retainInclude,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.opRetain.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
