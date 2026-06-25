import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateOpTurnoverStampDto } from './dto/create-op-turnover-stamp.dto';
import { UpdateOpTurnoverStampDto } from './dto/update-op-turnover-stamp.dto';
import { parseOpTurnoverStampImportWorkbook } from './op-turnover-stamp-excel-import';

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

  private async assertClientInCompany(clientId: string, companyId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, companyId, deletedAt: null },
    });
    if (!client) {
      throw new BadRequestException('Client not found or does not belong to your company');
    }
    return client;
  }

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
    if (dto.opTurnoverId) {
      await this.assertTurnoverInCompany(dto.opTurnoverId, companyId);
    }
    return this.prisma.opTurnoverStamp.create({
      data: {
        ...(dto.opTurnoverId ? { opTurnover: { connect: { id: dto.opTurnoverId } } } : {}),
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

  async findAll(companyId: string, opTurnoverId?: string) {
    if (opTurnoverId) {
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

    return this.prisma.opTurnoverStamp.findMany({
      where: {
        deletedAt: null,
        OR: [
          {
            opTurnover: {
              deletedAt: null,
              client: { companyId, deletedAt: null },
            },
          },
          { opTurnoverId: null },
        ],
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
        OR: [
          {
            opTurnover: {
              deletedAt: null,
              client: { companyId, deletedAt: null },
            },
          },
          { opTurnoverId: null },
        ],
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
    if (dto.opTurnoverId) {
      await this.assertTurnoverInCompany(dto.opTurnoverId, companyId);
    }
    const turnoverLink =
      dto.opTurnoverId === undefined
        ? {}
        : dto.opTurnoverId === null
          ? { opTurnover: { disconnect: true } }
          : { opTurnover: { connect: { id: dto.opTurnoverId } } };

    return this.prisma.opTurnoverStamp.update({
      where: { id },
      data: {
        ...turnoverLink,
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

  /** Import timbres depuis le modèle Excel (1ʳᵉ feuille). */
  async importFromExcelBuffer(buffer: Buffer, companyId: string, clientId: string) {
    await this.assertClientInCompany(clientId, companyId);
    const parsed = await parseOpTurnoverStampImportWorkbook(
      this.prisma,
      clientId,
      companyId,
      buffer,
    );

    const errors: { row: number; message: string }[] = [];
    const created: Awaited<ReturnType<OpTurnoverStampsService['create']>>[] = [];
    let linkedCount = 0;
    let unlinkedCount = 0;

    for (const item of parsed) {
      if ('error' in item) {
        errors.push({ row: item.rowNumber, message: item.error });
        continue;
      }
      try {
        const data = await this.create(
          {
            opTurnoverId: item.opTurnoverId ?? undefined,
            date: item.date,
            net: item.net,
            tax: item.tax,
            total: item.total,
            amount: item.amount,
            amountDeduction: item.amountDeduction,
          },
          companyId,
        );
        created.push(data);
        if (item.opTurnoverId) {
          linkedCount += 1;
        } else {
          unlinkedCount += 1;
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        errors.push({ row: item.rowNumber, message });
      }
    }

    return {
      createdCount: created.length,
      failedCount: errors.length,
      linkedCount,
      unlinkedCount,
      created,
      errors,
    };
  }
}
