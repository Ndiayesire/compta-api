import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateOpSuspensionDto } from './dto/create-op-suspension.dto';
import { UpdateOpSuspensionDto } from './dto/update-op-suspension.dto';

const suspensionInclude = {
  tier: true,
} satisfies Prisma.OpSuspensionInclude;

@Injectable()
export class OpSuspensionsService {
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

  async create(dto: CreateOpSuspensionDto) {
    await this.assertTier(dto.tierId);
    return this.prisma.opSuspension.create({
      data: {
        tierId: dto.tierId,
        code: dto.code,
        date: new Date(dto.date),
        month: dto.month,
        year: dto.year,
        net: new Prisma.Decimal(String(dto.net)),
        tax: new Prisma.Decimal(String(dto.tax)),
        total: new Prisma.Decimal(String(dto.total)),
        visaDate: new Date(dto.visaDate),
        visaNumber: dto.visaNumber,
      },
      include: suspensionInclude,
    });
  }

  async findAll(tierId?: string) {
    return this.prisma.opSuspension.findMany({
      where: {
        deletedAt: null,
        ...(tierId ? { tierId } : {}),
      },
      include: suspensionInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.opSuspension.findFirst({
      where: { id, deletedAt: null },
      include: suspensionInclude,
    });
    if (!row) {
      throw new NotFoundException('Op suspension not found');
    }
    return row;
  }

  async update(id: string, dto: UpdateOpSuspensionDto) {
    await this.findOne(id);
    if (dto.tierId) await this.assertTier(dto.tierId);
    return this.prisma.opSuspension.update({
      where: { id },
      data: {
        ...(dto.tierId !== undefined ? { tierId: dto.tierId } : {}),
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.date !== undefined ? { date: new Date(dto.date) } : {}),
        ...(dto.month !== undefined ? { month: dto.month } : {}),
        ...(dto.year !== undefined ? { year: dto.year } : {}),
        ...(dto.net !== undefined ? { net: new Prisma.Decimal(String(dto.net)) } : {}),
        ...(dto.tax !== undefined ? { tax: new Prisma.Decimal(String(dto.tax)) } : {}),
        ...(dto.total !== undefined ? { total: new Prisma.Decimal(String(dto.total)) } : {}),
        ...(dto.visaDate !== undefined ? { visaDate: new Date(dto.visaDate) } : {}),
        ...(dto.visaNumber !== undefined ? { visaNumber: dto.visaNumber } : {}),
      },
      include: suspensionInclude,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.opSuspension.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
