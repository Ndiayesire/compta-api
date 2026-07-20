import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateOpImportationDto } from './dto/create-op-importation.dto';
import { UpdateOpImportationDto } from './dto/update-op-importation.dto';
import { parseOpImportationImportWorkbook } from './op-importation-excel-import';

const importationInclude = {
  tier: true,
  country: true,
  deductionType: true,
  propertyNatureType: true,
} satisfies Prisma.OpImportationInclude;

@Injectable()
export class OpImportationsService {
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

  private async assertDeductionType(id: string) {
    const row = await this.prisma.deductionType.findFirst({
      where: { id, deletedAt: null, isActive: true },
    });
    if (!row) {
      throw new BadRequestException('Invalid deduction type');
    }
    return row;
  }

  private async assertPropertyNatureType(id: string) {
    const row = await this.prisma.propertyNatureType.findFirst({
      where: { id, deletedAt: null, isActive: true },
    });
    if (!row) {
      throw new BadRequestException('Invalid property nature type');
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

  async create(dto: CreateOpImportationDto) {
    await this.assertTier(dto.tierId);
    await this.assertCountry(dto.countryId);
    await this.assertDeductionType(dto.deductionTypeId);
    await this.assertPropertyNatureType(dto.propertyNatureTypeId);
    return this.prisma.opImportation.create({
      data: {
        tierId: dto.tierId,
        countryId: dto.countryId,
        deductionTypeId: dto.deductionTypeId,
        propertyNatureTypeId: dto.propertyNatureTypeId,
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
      include: importationInclude,
    });
  }

  async findAll(tierId?: string) {
    return this.prisma.opImportation.findMany({
      where: {
        deletedAt: null,
        ...(tierId ? { tierId } : {}),
      },
      include: importationInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.opImportation.findFirst({
      where: { id, deletedAt: null },
      include: importationInclude,
    });
    if (!row) {
      throw new NotFoundException('Op importation not found');
    }
    return row;
  }

  async update(id: string, dto: UpdateOpImportationDto) {
    await this.findOne(id);
    if (dto.tierId) await this.assertTier(dto.tierId);
    if (dto.countryId) await this.assertCountry(dto.countryId);
    if (dto.deductionTypeId) await this.assertDeductionType(dto.deductionTypeId);
    if (dto.propertyNatureTypeId) await this.assertPropertyNatureType(dto.propertyNatureTypeId);
    return this.prisma.opImportation.update({
      where: { id },
      data: {
        ...(dto.tierId !== undefined ? { tierId: dto.tierId } : {}),
        ...(dto.countryId !== undefined ? { countryId: dto.countryId } : {}),
        ...(dto.deductionTypeId !== undefined ? { deductionTypeId: dto.deductionTypeId } : {}),
        ...(dto.propertyNatureTypeId !== undefined
          ? { propertyNatureTypeId: dto.propertyNatureTypeId }
          : {}),
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
      include: importationInclude,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.opImportation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /** Import importations depuis le modèle Excel (1ʳᵉ feuille). */
  async importFromExcelBuffer(buffer: Buffer, companyId: string, clientId: string) {
    await this.assertClientBelongsToCompany(clientId, companyId);
    const parsed = await parseOpImportationImportWorkbook(this.prisma, clientId, buffer);

    const errors: { row: number; message: string }[] = [];
    const created: Awaited<ReturnType<OpImportationsService['create']>>[] = [];
    const updated: Awaited<ReturnType<OpImportationsService['update']>>[] = [];
    let tiersCreatedCount = 0;
    let countriesCreatedCount = 0;
    let deductionTypesCreatedCount = 0;
    let propertyNatureTypesCreatedCount = 0;

    for (const item of parsed) {
      if ('error' in item) {
        errors.push({ row: item.rowNumber, message: item.error });
        continue;
      }
      if (item.tierCreated) tiersCreatedCount += 1;
      if (item.countryCreated) countriesCreatedCount += 1;
      if (item.deductionTypeCreated) deductionTypesCreatedCount += 1;
      if (item.propertyNatureTypeCreated) propertyNatureTypesCreatedCount += 1;
      try {
        const existing = await this.prisma.opImportation.findFirst({
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
            taxDeduction: item.dto.taxDeduction,
            total: item.dto.total,
            prorata: item.dto.prorata,
            date: item.dto.date,
            countryId: item.dto.countryId,
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
      countriesCreatedCount,
      deductionTypesCreatedCount,
      propertyNatureTypesCreatedCount,
      created,
      updated,
      errors,
    };
  }
}
