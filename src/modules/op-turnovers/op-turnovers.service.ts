import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateOpTurnoverDto } from './dto/create-op-turnover.dto';
import { UpdateOpTurnoverDto } from './dto/update-op-turnover.dto';
import { CreateOpTurnoverStampDto } from './dto/create-op-turnover-stamp.dto';
import { UpdateOpTurnoverStampDto } from './dto/update-op-turnover-stamp.dto';

const turnoverInclude = {
  client: { select: { id: true, name: true, companyId: true } },
  stamps: { where: { deletedAt: null }, orderBy: { date: 'desc' as const } },
} satisfies Prisma.OpTurnoverInclude;

const stampInclude = {
  opTurnover: {
    include: {
      client: { select: { id: true, name: true, companyId: true } },
    },
  },
} satisfies Prisma.OpTurnoverStampInclude;

@Injectable()
export class OpTurnoversService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertClientInCompany(clientId: string, companyId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, companyId, deletedAt: null },
    });
    if (!client) {
      throw new BadRequestException('Client not found or does not belong to your company');
    }
    return client;
  }

  private async assertTurnoverInCompany(id: string, companyId: string) {
    const row = await this.prisma.opTurnover.findFirst({
      where: {
        id,
        deletedAt: null,
        client: { companyId, deletedAt: null },
      },
    });
    if (!row) {
      throw new NotFoundException('Op turnover not found');
    }
    return row;
  }

  async create(dto: CreateOpTurnoverDto, companyId: string) {
    await this.assertClientInCompany(dto.clientId, companyId);
    return this.prisma.opTurnover.create({
      data: {
        clientId: dto.clientId,
        number: dto.number,
        date: new Date(dto.date),
        net: new Prisma.Decimal(String(dto.net)),
        tax: new Prisma.Decimal(String(dto.tax)),
        total: new Prisma.Decimal(String(dto.total)),
      },
      include: turnoverInclude,
    });
  }

  async findAll(companyId: string, clientId?: string) {
    return this.prisma.opTurnover.findMany({
      where: {
        deletedAt: null,
        client: {
          companyId,
          deletedAt: null,
          ...(clientId ? { id: clientId } : {}),
        },
      },
      include: turnoverInclude,
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const row = await this.prisma.opTurnover.findFirst({
      where: {
        id,
        deletedAt: null,
        client: { companyId, deletedAt: null },
      },
      include: turnoverInclude,
    });
    if (!row) {
      throw new NotFoundException('Op turnover not found');
    }
    return row;
  }

  async update(id: string, dto: UpdateOpTurnoverDto, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.opTurnover.update({
      where: { id },
      data: {
        ...(dto.number !== undefined ? { number: dto.number } : {}),
        ...(dto.date !== undefined ? { date: new Date(dto.date) } : {}),
        ...(dto.net !== undefined ? { net: new Prisma.Decimal(String(dto.net)) } : {}),
        ...(dto.tax !== undefined ? { tax: new Prisma.Decimal(String(dto.tax)) } : {}),
        ...(dto.total !== undefined ? { total: new Prisma.Decimal(String(dto.total)) } : {}),
      },
      include: turnoverInclude,
    });
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.opTurnover.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async createStamp(dto: CreateOpTurnoverStampDto, companyId: string) {
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

  async findAllStamps(opTurnoverId: string, companyId: string) {
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

  async findOneStamp(id: string, companyId: string) {
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

  async updateStamp(id: string, dto: UpdateOpTurnoverStampDto, companyId: string) {
    await this.findOneStamp(id, companyId);
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

  async removeStamp(id: string, companyId: string) {
    await this.findOneStamp(id, companyId);
    return this.prisma.opTurnoverStamp.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
