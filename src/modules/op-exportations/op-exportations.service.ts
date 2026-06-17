import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateOpExportationDto } from './dto/create-op-exportation.dto';
import { UpdateOpExportationDto } from './dto/update-op-exportation.dto';
import { parseOpExportationImportWorkbook } from './op-exportation-excel-import';

const exportationInclude = {
  tier: true,
  country: true,
} satisfies Prisma.OpExportationInclude;

@Injectable()
export class OpExportationsService {
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

  private async assertCountry(id: string) {
    const row = await this.prisma.country.findFirst({
      where: { id, isActive: true },
    });
    if (!row) {
      throw new BadRequestException('Invalid country');
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

  async create(dto: CreateOpExportationDto) {
    await this.assertTier(dto.tierId);
    await this.assertCountry(dto.countryId);
    return this.prisma.opExportation.create({
      data: {
        tierId: dto.tierId,
        countryId: dto.countryId,
        code: dto.code,
        month: dto.month,
        year: dto.year,
        date: new Date(dto.date),
        ...(dto.net !== undefined ? { net: new Prisma.Decimal(String(dto.net)) } : {}),
        ...(dto.tax !== undefined ? { tax: new Prisma.Decimal(String(dto.tax)) } : {}),
        ...(dto.taxDeduction !== undefined
          ? { taxDeduction: new Prisma.Decimal(String(dto.taxDeduction)) }
          : {}),
        ...(dto.total !== undefined ? { total: new Prisma.Decimal(String(dto.total)) } : {}),
        ...(dto.prorata !== undefined ? { prorata: new Prisma.Decimal(String(dto.prorata)) } : {}),
      },
      include: exportationInclude,
    });
  }

  async findAll(tierId?: string) {
    return this.prisma.opExportation.findMany({
      where: {
        deletedAt: null,
        ...(tierId ? { tierId } : {}),
      },
      include: exportationInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.opExportation.findFirst({
      where: { id, deletedAt: null },
      include: exportationInclude,
    });
    if (!row) {
      throw new NotFoundException('Op exportation not found');
    }
    return row;
  }

  async update(id: string, dto: UpdateOpExportationDto) {
    await this.findOne(id);
    if (dto.tierId) await this.assertTier(dto.tierId);
    if (dto.countryId) await this.assertCountry(dto.countryId);
    return this.prisma.opExportation.update({
      where: { id },
      data: {
        ...(dto.tierId !== undefined ? { tierId: dto.tierId } : {}),
        ...(dto.countryId !== undefined ? { countryId: dto.countryId } : {}),
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.month !== undefined ? { month: dto.month } : {}),
        ...(dto.year !== undefined ? { year: dto.year } : {}),
        ...(dto.date !== undefined ? { date: new Date(dto.date) } : {}),
        ...(dto.net !== undefined ? { net: new Prisma.Decimal(String(dto.net)) } : {}),
        ...(dto.tax !== undefined ? { tax: new Prisma.Decimal(String(dto.tax)) } : {}),
        ...(dto.taxDeduction !== undefined
          ? { taxDeduction: new Prisma.Decimal(String(dto.taxDeduction)) }
          : {}),
        ...(dto.total !== undefined ? { total: new Prisma.Decimal(String(dto.total)) } : {}),
        ...(dto.prorata !== undefined ? { prorata: new Prisma.Decimal(String(dto.prorata)) } : {}),
      },
      include: exportationInclude,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.opExportation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /** Import exportations depuis le modèle Excel (1ʳᵉ feuille). */
  async importFromExcelBuffer(buffer: Buffer, companyId: string, clientId: string) {
    await this.assertClientBelongsToCompany(clientId, companyId);
    const parsed = await parseOpExportationImportWorkbook(this.prisma, clientId, buffer);

    const errors: { row: number; message: string }[] = [];
    const created: Awaited<ReturnType<OpExportationsService['create']>>[] = [];
    let tiersCreatedCount = 0;
    let tiersUpdatedCount = 0;

    for (const item of parsed) {
      if ('error' in item) {
        errors.push({ row: item.rowNumber, message: item.error });
        continue;
      }
      if (item.tierCreated) {
        tiersCreatedCount += 1;
      }
      if (item.tierUpdated) {
        tiersUpdatedCount += 1;
      }
      try {
        const data = await this.create(item.dto);
        created.push(data);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        errors.push({ row: item.rowNumber, message });
      }
    }

    return {
      createdCount: created.length,
      failedCount: errors.length,
      tiersCreatedCount,
      tiersUpdatedCount,
      created,
      errors,
    };
  }
}
