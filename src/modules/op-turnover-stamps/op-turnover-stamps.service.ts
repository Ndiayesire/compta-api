import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateOpTurnoverStampDto } from './dto/create-op-turnover-stamp.dto';
import { UpdateOpTurnoverStampDto } from './dto/update-op-turnover-stamp.dto';

const stampInclude = {
  opTurnover: {
    include: {
      client: { select: { id: true, name: true, companyId: true } },
    },
  },
} satisfies Prisma.OpTurnoverStampInclude;

@Injectable()
export class OpTurnoverStampsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertTurnoverInCompany(opTurnoverId: string, companyId: string) {
    const row = await this.prisma.opTurnover.findFirst({
      where: {
        id: opTurnoverId,
        deletedAt: null,
        client: { companyId, deletedAt: null },
      },
    });
    if (!row) {
      throw new NotFoundException('Op turnover not found');
    }
    return row;
  }

  async create(dto: CreateOpTurnoverStampDto, companyId: string) {
    await this.assertTurnoverInCompany(dto.opTurnoverId, companyId);
    return this.prisma.opTurnoverStamp.create({
      data: {
        opTurnoverId: dto.opTurnoverId,
        date: new Date(dto.date),
        net: new Prisma.Decimal(String(dto.net)),
        tax: new Prisma.Decimal(String(dto.tax)),
        total: new Prisma.Decimal(String(dto.total)),
        amount: dto.amount as Prisma.InputJsonValue,
        amountDeduction: dto.amountDeduction as Prisma.InputJsonValue,
      },
      include: stampInclude,
    });
  }

  async findAll(opTurnoverId: string, companyId: string) {
    await this.assertTurnoverInCompany(opTurnoverId, companyId);
    return this.prisma.opTurnoverStamp.findMany({
      where: {
        opTurnoverId,
        deletedAt: null,
        opTurnover: {
          deletedAt: null,
          client: { companyId, deletedAt: null },
        },
      },
      include: stampInclude,
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const row = await this.prisma.opTurnoverStamp.findFirst({
      where: {
        id,
        deletedAt: null,
        opTurnover: {
          deletedAt: null,
          client: { companyId, deletedAt: null },
        },
      },
      include: stampInclude,
    });
    if (!row) {
      throw new NotFoundException('Op turnover stamp not found');
    }
    return row;
  }

  async update(id: string, dto: UpdateOpTurnoverStampDto, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.opTurnoverStamp.update({
      where: { id },
      data: {
        ...(dto.date !== undefined ? { date: new Date(dto.date) } : {}),
        ...(dto.net !== undefined ? { net: new Prisma.Decimal(String(dto.net)) } : {}),
        ...(dto.tax !== undefined ? { tax: new Prisma.Decimal(String(dto.tax)) } : {}),
        ...(dto.total !== undefined ? { total: new Prisma.Decimal(String(dto.total)) } : {}),
        ...(dto.amount !== undefined ? { amount: dto.amount as Prisma.InputJsonValue } : {}),
        ...(dto.amountDeduction !== undefined
          ? { amountDeduction: dto.amountDeduction as Prisma.InputJsonValue }
          : {}),
      },
      include: stampInclude,
    });
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.opTurnoverStamp.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
