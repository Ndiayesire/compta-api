import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateDeductionTypeDto } from './dto/create-deduction-type.dto';
import { UpdateDeductionTypeDto } from './dto/update-deduction-type.dto';

@Injectable()
export class DeductionTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDeductionTypeDto) {
    const existing = await this.prisma.deductionType.findFirst({
      where: {
        deletedAt: null,
        OR: [{ code: dto.code }, { name: dto.name }],
      },
    });
    if (existing) {
      throw new BadRequestException('A deduction type with the same code or name already exists');
    }
    return this.prisma.deductionType.create({
      data: {
        code: dto.code,
        name: dto.name,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll() {
    return this.prisma.deductionType.findMany({
      where: { deletedAt: null },
      orderBy: { code: 'asc' },
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.deductionType.findFirst({
      where: { id, deletedAt: null },
    });
    if (!row) {
      throw new NotFoundException('Deduction type not found');
    }
    return row;
  }

  async update(id: string, dto: UpdateDeductionTypeDto) {
    await this.findOne(id);
    if (dto.code || dto.name) {
      const duplicate = await this.prisma.deductionType.findFirst({
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
        throw new BadRequestException('Another deduction type with the same code or name already exists');
      }
    }
    return this.prisma.deductionType.update({
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
    const used = await this.prisma.opLocalPurchase.count({
      where: { deductionTypeId: id, deletedAt: null },
    });
    if (used > 0) {
      throw new BadRequestException('Cannot delete deduction type while local purchases reference it');
    }
    return this.prisma.deductionType.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
