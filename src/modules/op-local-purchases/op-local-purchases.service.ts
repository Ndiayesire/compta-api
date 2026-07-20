import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateOpLocalPurchaseDto } from './dto/create-op-local-purchase.dto';
import { UpdateOpLocalPurchaseDto } from './dto/update-op-local-purchase.dto';
import { parseOpLocalPurchaseImportWorkbook } from './op-local-purchase-excel-import';

const purchaseInclude = {
  tier: true,
  deductionType: true,
  propertyNatureType: true,
} satisfies Prisma.OpLocalPurchaseInclude;

@Injectable()
export class OpLocalPurchasesService {
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

  async create(dto: CreateOpLocalPurchaseDto) {
    await this.assertTier(dto.tierId);
    await this.assertDeductionType(dto.deductionTypeId);
    await this.assertPropertyNatureType(dto.propertyNatureTypeId);
    return this.prisma.opLocalPurchase.create({
      data: {
        tierId: dto.tierId,
        deductionTypeId: dto.deductionTypeId,
        propertyNatureTypeId: dto.propertyNatureTypeId,
        month: dto.month,
        year: dto.year,
        net: new Prisma.Decimal(String(dto.net)),
        tax: new Prisma.Decimal(String(dto.tax)),
        taxDeduction: new Prisma.Decimal(String(dto.taxDeduction)),
        total: new Prisma.Decimal(String(dto.total)),
        prorata: dto.prorata as Prisma.InputJsonValue,
      },
      include: purchaseInclude,
    });
  }

  async findAll(tierId?: string) {
    return this.prisma.opLocalPurchase.findMany({
      where: {
        deletedAt: null,
        ...(tierId ? { tierId } : {}),
      },
      include: purchaseInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.opLocalPurchase.findFirst({
      where: { id, deletedAt: null },
      include: purchaseInclude,
    });
    if (!row) {
      throw new NotFoundException('Op local purchase not found');
    }
    return row;
  }

  async update(id: string, dto: UpdateOpLocalPurchaseDto) {
    await this.findOne(id);
    if (dto.tierId) await this.assertTier(dto.tierId);
    if (dto.deductionTypeId) await this.assertDeductionType(dto.deductionTypeId);
    if (dto.propertyNatureTypeId) await this.assertPropertyNatureType(dto.propertyNatureTypeId);
    return this.prisma.opLocalPurchase.update({
      where: { id },
      data: {
        ...(dto.tierId !== undefined ? { tierId: dto.tierId } : {}),
        ...(dto.deductionTypeId !== undefined ? { deductionTypeId: dto.deductionTypeId } : {}),
        ...(dto.propertyNatureTypeId !== undefined
          ? { propertyNatureTypeId: dto.propertyNatureTypeId }
          : {}),
        ...(dto.month !== undefined ? { month: dto.month } : {}),
        ...(dto.year !== undefined ? { year: dto.year } : {}),
        ...(dto.net !== undefined ? { net: new Prisma.Decimal(String(dto.net)) } : {}),
        ...(dto.tax !== undefined ? { tax: new Prisma.Decimal(String(dto.tax)) } : {}),
        ...(dto.taxDeduction !== undefined
          ? { taxDeduction: new Prisma.Decimal(String(dto.taxDeduction)) }
          : {}),
        ...(dto.total !== undefined ? { total: new Prisma.Decimal(String(dto.total)) } : {}),
        ...(dto.prorata !== undefined ? { prorata: dto.prorata as Prisma.InputJsonValue } : {}),
      },
      include: purchaseInclude,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.opLocalPurchase.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /** Import achats locaux depuis le modèle Excel (1ʳᵉ feuille).
   *  Upsert par (tierId, month, year, net, tax, taxDeduction, deductionTypeId, propertyNatureTypeId).
   *  Met à jour total + prorata si la ligne existe déjà, crée sinon.
   */
  async importFromExcelBuffer(buffer: Buffer, companyId: string, clientId: string) {
    await this.assertClientBelongsToCompany(clientId, companyId);
    const parsed = await parseOpLocalPurchaseImportWorkbook(this.prisma, clientId, buffer);

    const errors:  { row: number; message: string }[] = [];
    const created: Awaited<ReturnType<OpLocalPurchasesService['create']>>[] = [];
    const updated: Awaited<ReturnType<OpLocalPurchasesService['update']>>[] = [];
    let tiersCreatedCount = 0;
    let tiersUpdatedCount = 0;
    let deductionTypesCreatedCount = 0;
    let propertyNatureTypesCreatedCount = 0;

    for (const item of parsed) {
      if ('error' in item) {
        errors.push({ row: item.rowNumber, message: item.error });
        continue;
      }
      if (item.tierCreated) tiersCreatedCount += 1;
      if (item.tierUpdated) tiersUpdatedCount += 1;
      if (item.deductionTypeCreated) deductionTypesCreatedCount += 1;
      if (item.propertyNatureTypeCreated) propertyNatureTypesCreatedCount += 1;
      try {
        const existing = await this.prisma.opLocalPurchase.findFirst({
          where: {
            tierId:              item.dto.tierId,
            month:               item.dto.month,
            year:                item.dto.year,
            net:                 new Prisma.Decimal(String(item.dto.net)),
            tax:                 new Prisma.Decimal(String(item.dto.tax)),
            taxDeduction:        new Prisma.Decimal(String(item.dto.taxDeduction)),
            deductionTypeId:     item.dto.deductionTypeId,
            propertyNatureTypeId: item.dto.propertyNatureTypeId,
            deletedAt: null,
          },
        });

        if (existing) {
          const data = await this.update(existing.id, {
            total:   item.dto.total,
            prorata: item.dto.prorata,
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
      failedCount:  errors.length,
      tiersCreatedCount,
      tiersUpdatedCount,
      deductionTypesCreatedCount,
      propertyNatureTypesCreatedCount,
      created,
      updated,
      errors,
    };
  }
}
