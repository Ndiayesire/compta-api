import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateOpExemptionDto } from './dto/create-op-exemption.dto';
import { UpdateOpExemptionDto } from './dto/update-op-exemption.dto';

const exemptionInclude = {
  tier: true,
} satisfies Prisma.OpExemptionInclude;

@Injectable()
export class OpExemptionsService {
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

  async create(dto: CreateOpExemptionDto) {
    await this.assertTier(dto.tierId);
    return this.prisma.opExemption.create({
      data: {
        tierId: dto.tierId,
        code: dto.code,
        month: dto.month,
        year: dto.year,
        amount: new Prisma.Decimal(String(dto.amount)),
        desc: dto.desc,
      },
      include: exemptionInclude,
    });
  }

  async findAll(tierId?: string) {
    return this.prisma.opExemption.findMany({
      where: {
        deletedAt: null,
        ...(tierId ? { tierId } : {}),
      },
      include: exemptionInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.opExemption.findFirst({
      where: { id, deletedAt: null },
      include: exemptionInclude,
    });
    if (!row) {
      throw new NotFoundException('Op exemption not found');
    }
    return row;
  }

  async update(id: string, dto: UpdateOpExemptionDto) {
    await this.findOne(id);
    if (dto.tierId) await this.assertTier(dto.tierId);
    return this.prisma.opExemption.update({
      where: { id },
      data: {
        ...(dto.tierId !== undefined ? { tierId: dto.tierId } : {}),
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.month !== undefined ? { month: dto.month } : {}),
        ...(dto.year !== undefined ? { year: dto.year } : {}),
        ...(dto.amount !== undefined ? { amount: new Prisma.Decimal(String(dto.amount)) } : {}),
        ...(dto.desc !== undefined ? { desc: dto.desc } : {}),
      },
      include: exemptionInclude,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.opExemption.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
