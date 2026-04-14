import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateTierTypeDto } from './dto/create-tier-type.dto';
import { UpdateTierTypeDto } from './dto/update-tier-type.dto';

@Injectable()
export class TierTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTierTypeDto) {
    const existing = await this.prisma.tierType.findFirst({
      where: {
        OR: [{ code: dto.code }, { name: dto.name }],
      },
    });

    if (existing) {
      throw new BadRequestException(
        'A tier type with the same name or code already exists',
      );
    }

    return this.prisma.tierType.create({ data: dto });
  }

  async findAll() {
    return this.prisma.tierType.findMany({
      orderBy: { code: 'asc' },
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.tierType.findUnique({
      where: { id },
    });

    if (!row) {
      throw new NotFoundException('Tier type not found');
    }

    return row;
  }

  async update(id: string, dto: UpdateTierTypeDto) {
    await this.findOne(id);

    if (dto.code || dto.name) {
      const duplicate = await this.prisma.tierType.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                dto.code ? { code: dto.code } : {},
                dto.name ? { name: dto.name } : {},
              ],
            },
          ],
        },
      });

      if (duplicate) {
        throw new BadRequestException(
          'Another tier type with the same name or code already exists',
        );
      }
    }

    return this.prisma.tierType.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    const used = await this.prisma.tier.count({
      where: { tierTypeId: id, deletedAt: null },
    });

    if (used > 0) {
      throw new BadRequestException(
        'Cannot deactivate this tier type because tiers still reference it',
      );
    }

    return this.prisma.tierType.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
