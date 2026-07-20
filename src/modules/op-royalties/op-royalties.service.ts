import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateOpRoyaltyDto } from './dto/create-op-royalty.dto';
import { UpdateOpRoyaltyDto } from './dto/update-op-royalty.dto';
import { parseOpRoyaltyImportWorkbook } from './op-royalty-excel-import';

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

  private async assertClientInCompany(clientId: string, companyId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, companyId, deletedAt: null },
    });
    if (!client) {
      throw new BadRequestException('Client not found or does not belong to your company');
    }
    return client;
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

  /** Import redevances depuis le modèle Excel (1ʳᵉ feuille). */
  async importFromExcelBuffer(buffer: Buffer, companyId: string, clientId: string) {
    await this.assertClientInCompany(clientId, companyId);
    const parsed = await parseOpRoyaltyImportWorkbook(this.prisma, clientId, buffer);

    const errors: { row: number; message: string }[] = [];
    const created: Awaited<ReturnType<OpRoyaltiesService['create']>>[] = [];
    const updated: Awaited<ReturnType<OpRoyaltiesService['update']>>[] = [];
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
        const existing = await this.prisma.opRoyalty.findFirst({
          where: {
            tierId: item.dto.tierId,
            code: item.dto.code,
            date: new Date(item.dto.date),
            deletedAt: null,
          },
        });
        if (existing) {
          const data = await this.update(existing.id, {
            base: item.dto.base,
            rate: item.dto.rate,
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
