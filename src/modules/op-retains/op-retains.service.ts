import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateOpRetainDto } from './dto/create-op-retain.dto';
import { UpdateOpRetainDto } from './dto/update-op-retain.dto';
import { parseOpRetainImportWorkbook } from './op-retain-excel-import';

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

  private async assertClientInCompany(clientId: string, companyId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, companyId, deletedAt: null },
    });
    if (!client) {
      throw new BadRequestException('Client not found or does not belong to your company');
    }
    return client;
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

  /** Import retenues depuis le modèle Excel (1ʳᵉ feuille).
   *  Upsert par (tierId, code) : le numéro de facture identifie une retenue par tiers.
   *  Met à jour date, month, year, base, rate, amount si la ligne existe déjà, crée sinon.
   */
  async importFromExcelBuffer(buffer: Buffer, companyId: string, clientId: string) {
    await this.assertClientInCompany(clientId, companyId);
    const parsed = await parseOpRetainImportWorkbook(this.prisma, clientId, buffer);

    const errors: { row: number; message: string }[] = [];
    const created: Awaited<ReturnType<OpRetainsService['create']>>[] = [];
    const updated: Awaited<ReturnType<OpRetainsService['update']>>[] = [];
    let tiersCreatedCount = 0;

    for (const item of parsed) {
      if ('error' in item) {
        errors.push({ row: item.rowNumber, message: item.error });
        continue;
      }
      if (item.tierCreated) {
        tiersCreatedCount += 1;
      }
      try {
        const existing = await this.prisma.opRetain.findFirst({
          where: {
            tierId:    item.dto.tierId,
            code:      item.dto.code,
            deletedAt: null,
          },
        });
        if (existing) {
          const data = await this.update(existing.id, {
            date:   item.dto.date,
            month:  item.dto.month,
            year:   item.dto.year,
            base:   item.dto.base,
            rate:   item.dto.rate,
            amount: item.dto.amount,
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
      created,
      updated,
      errors,
    };
  }
}
