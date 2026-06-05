import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateOpLocalPurchaseDto } from './dto/create-op-local-purchase.dto';
import { UpdateOpLocalPurchaseDto } from './dto/update-op-local-purchase.dto';

const purchaseInclude = {
  provider: true,
  deductionType: true,
  propertyNatureType: true,
} satisfies Prisma.OpLocalPurchaseInclude;

@Injectable()
export class OpLocalPurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertProvider(id: string) {
    const row = await this.prisma.provider.findFirst({
      where: { id, deletedAt: null },
    });
    if (!row) {
      throw new BadRequestException('Invalid provider');
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

  async create(dto: CreateOpLocalPurchaseDto) {
    await this.assertProvider(dto.providerId);
    await this.assertDeductionType(dto.deductionTypeId);
    await this.assertPropertyNatureType(dto.propertyNatureTypeId);
    return this.prisma.opLocalPurchase.create({
      data: {
        providerId: dto.providerId,
        deductionTypeId: dto.deductionTypeId,
        propertyNatureTypeId: dto.propertyNatureTypeId,
        month: new Date(dto.month),
        year: new Date(dto.year),
        net: new Prisma.Decimal(String(dto.net)),
        tax: new Prisma.Decimal(String(dto.tax)),
        taxDeduction: new Prisma.Decimal(String(dto.taxDeduction)),
        total: new Prisma.Decimal(String(dto.total)),
        prorata: dto.prorata as Prisma.InputJsonValue,
      },
      include: purchaseInclude,
    });
  }

  async findAll(providerId?: string) {
    return this.prisma.opLocalPurchase.findMany({
      where: {
        deletedAt: null,
        ...(providerId ? { providerId } : {}),
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
    if (dto.providerId) await this.assertProvider(dto.providerId);
    if (dto.deductionTypeId) await this.assertDeductionType(dto.deductionTypeId);
    if (dto.propertyNatureTypeId) await this.assertPropertyNatureType(dto.propertyNatureTypeId);
    return this.prisma.opLocalPurchase.update({
      where: { id },
      data: {
        ...(dto.providerId !== undefined ? { providerId: dto.providerId } : {}),
        ...(dto.deductionTypeId !== undefined ? { deductionTypeId: dto.deductionTypeId } : {}),
        ...(dto.propertyNatureTypeId !== undefined
          ? { propertyNatureTypeId: dto.propertyNatureTypeId }
          : {}),
        ...(dto.month !== undefined ? { month: new Date(dto.month) } : {}),
        ...(dto.year !== undefined ? { year: new Date(dto.year) } : {}),
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
}
