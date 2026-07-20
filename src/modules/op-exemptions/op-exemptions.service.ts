import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateOpExemptionDto } from './dto/create-op-exemption.dto';
import { UpdateOpExemptionDto } from './dto/update-op-exemption.dto';
import { parseOpExemptionImportWorkbook } from './op-exemption-excel-import';

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

  private async assertClientBelongsToCompany(clientId: string, companyId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, companyId, deletedAt: null },
    });
    if (!client) {
      throw new BadRequestException('Client not found or does not belong to your company');
    }
    return client;
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

  /**
   * Import exonérations depuis le modèle Excel (1ʳᵉ feuille, en-têtes du template).
   * Le client est fixé par `clientId` (query) — les tiers sont résolus par nom / référence / NINEA.
   */
  async importFromExcelBuffer(buffer: Buffer, companyId: string, clientId: string, year: number) {
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      throw new BadRequestException('Query year must be an integer between 1900 and 2100');
    }
    await this.assertClientBelongsToCompany(clientId, companyId);
    const parsed = await parseOpExemptionImportWorkbook(this.prisma, clientId, year, buffer);

    const errors: { row: number; message: string }[] = [];
    const created: Awaited<ReturnType<OpExemptionsService['create']>>[] = [];
    const updated: Awaited<ReturnType<OpExemptionsService['update']>>[] = [];
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
        const existing = await this.prisma.opExemption.findFirst({
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
            amount: item.dto.amount,
            desc: item.dto.desc,
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
