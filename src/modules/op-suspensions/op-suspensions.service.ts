import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateOpSuspensionDto } from './dto/create-op-suspension.dto';
import { UpdateOpSuspensionDto } from './dto/update-op-suspension.dto';
import { parseOpSuspensionImportWorkbook } from './op-suspension-excel-import';

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

  private async assertClientInCompany(clientId: string, companyId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, companyId, deletedAt: null },
    });
    if (!client) {
      throw new BadRequestException('Client not found or does not belong to your company');
    }
    return client;
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

  /** Import suspensions depuis le modèle Excel (1ʳᵉ feuille). */
  async importFromExcelBuffer(buffer: Buffer, companyId: string, clientId: string) {
    await this.assertClientInCompany(clientId, companyId);
    const parsed = await parseOpSuspensionImportWorkbook(this.prisma, clientId, buffer);

    const errors: { row: number; message: string }[] = [];
    const created: Awaited<ReturnType<OpSuspensionsService['create']>>[] = [];
    const updated: Awaited<ReturnType<OpSuspensionsService['update']>>[] = [];
    let tiersCreatedCount = 0;
    let tiersUpdatedCount = 0;

    for (const item of parsed) {
      if ('error' in item) {
        errors.push({ row: item.rowNumber, message: item.error });
        continue;
      }
      if (item.tierCreated) tiersCreatedCount += 1;
      if (item.tierUpdated) tiersUpdatedCount += 1;
      try {
        const existing = await this.prisma.opSuspension.findFirst({
          where: {
            tierId: item.dto.tierId,
            code: item.dto.code,
            month: item.dto.month,
            year: item.dto.year,
            deletedAt: null,
          },
        });
        if (existing) {
          const data = await this.update(existing.id, {
            net: item.dto.net,
            tax: item.dto.tax,
            total: item.dto.total,
            visaDate: item.dto.visaDate,
            visaNumber: item.dto.visaNumber,
            date: item.dto.date,
          });
          updated.push(data);
        } else {
          const data = await this.create(item.dto);
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
      failedCount: errors.length,
      tiersCreatedCount,
      tiersUpdatedCount,
      created,
      updated,
      errors,
    };
  }
}
