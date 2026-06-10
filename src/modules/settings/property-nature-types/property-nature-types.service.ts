import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreatePropertyNatureTypeDto } from './dto/create-property-nature-type.dto';
import { UpdatePropertyNatureTypeDto } from './dto/update-property-nature-type.dto';

@Injectable()
export class PropertyNatureTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePropertyNatureTypeDto) {
    const existing = await this.prisma.propertyNatureType.findFirst({
      where: {
        deletedAt: null,
        OR: [{ code: dto.code }, { name: dto.name }],
      },
    });
    if (existing) {
      throw new BadRequestException('A property nature type with the same code or name already exists');
    }
    return this.prisma.propertyNatureType.create({
      data: {
        code: dto.code,
        name: dto.name,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll() {
    return this.prisma.propertyNatureType.findMany({
      where: { deletedAt: null },
      orderBy: { code: 'asc' },
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.propertyNatureType.findFirst({
      where: { id, deletedAt: null },
    });
    if (!row) {
      throw new NotFoundException('Property nature type not found');
    }
    return row;
  }

  async update(id: string, dto: UpdatePropertyNatureTypeDto) {
    await this.findOne(id);
    if (dto.code || dto.name) {
      const duplicate = await this.prisma.propertyNatureType.findFirst({
        where: {
          deletedAt: null,
          id: { not: id },
          OR: [
            ...(dto.code ? [{ code: dto.code }] : []),
            ...(dto.name ? [{ name: dto.name }] : []),
          ],
        },
      });
      if (duplicate) {
        throw new BadRequestException('Another property nature type with the same code or name already exists');
      }
    }
    return this.prisma.propertyNatureType.update({
      where: { id },
      data: {
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    const usedLocal = await this.prisma.opLocalPurchase.count({
      where: { propertyNatureTypeId: id, deletedAt: null },
    });
    const usedImport = await this.prisma.opImportation.count({
      where: { propertyNatureTypeId: id, deletedAt: null },
    });
    if (usedLocal > 0 || usedImport > 0) {
      throw new BadRequestException('Cannot delete property nature type while purchases or importations reference it');
    }
    return this.prisma.propertyNatureType.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
