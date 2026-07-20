import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateOpTurnoverDto } from './dto/create-op-turnover.dto';
import { UpdateOpTurnoverDto } from './dto/update-op-turnover.dto';
import { parseOpTurnoverImportWorkbook } from './op-turnover-excel-import';

const turnoverInclude = {
  client: { select: { id: true, name: true, companyId: true } },
  stamps: { where: { deletedAt: null }, orderBy: { date: 'desc' as const } },
} satisfies Prisma.OpTurnoverInclude;

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

  /** Import chiffres d'affaires depuis le modèle Excel (1ʳᵉ feuille).
   *  Upsert par (clientId, date, number) : met à jour si la facture existe déjà, crée sinon.
   */
  async importFromExcelBuffer(buffer: Buffer, companyId: string, clientId: string) {
    await this.assertClientInCompany(clientId, companyId);
    const parsed = await parseOpTurnoverImportWorkbook(this.prisma, clientId, buffer);

    const errors:   { row: number; message: string }[] = [];
    const created:  Awaited<ReturnType<OpTurnoversService['create']>>[] = [];
    const updated:  Awaited<ReturnType<OpTurnoversService['update']>>[] = [];

    for (const item of parsed) {
      if ('error' in item) {
        errors.push({ row: item.rowNumber, message: item.error });
        continue;
      }
      try {
        const existing = await this.prisma.opTurnover.findFirst({
          where: {
            clientId: item.dto.clientId,
            number:   item.dto.number,
            date:     new Date(item.dto.date),
            deletedAt: null,
          },
        });

        if (existing) {
          const data = await this.update(
            existing.id,
            { net: item.dto.net, tax: item.dto.tax, total: item.dto.total },
            companyId,
          );
          updated.push(data);
        } else {
          const data = await this.create(item.dto, companyId);
          created.push(data);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        errors.push({ row: item.rowNumber, message });
      }
    }

    return {
      createdCount: created.length,
      updatedCount: updated.length,
      failedCount:  errors.length,
      created,
      updated,
      errors,
    };
  }
}
