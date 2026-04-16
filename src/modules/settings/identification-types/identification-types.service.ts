import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateIdentificationTypeDto } from './dto/create-identification-type.dto';
import { UpdateIdentificationTypeDto } from './dto/update-identification-type.dto';

@Injectable()
export class IdentificationTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateIdentificationTypeDto) {
    const existing = await this.prisma.identificationType.findFirst({
      where: {
        OR: [{ code: dto.code }, { name: dto.name }],
      },
    });

    if (existing) {
      throw new BadRequestException(
        'An identification type with the same name or code already exists',
      );
    }

    return this.prisma.identificationType.create({
      data: {
        name: dto.name,
        code: dto.code,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll() {
    return this.prisma.identificationType.findMany({
      orderBy: { code: 'asc' },
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.identificationType.findFirst({
      where: { id },
    });

    if (!row) {
      throw new NotFoundException('Identification type not found');
    }

    return row;
  }

  async update(id: string, dto: UpdateIdentificationTypeDto) {
    await this.findOne(id);

    if (dto.code || dto.name) {
      const duplicate = await this.prisma.identificationType.findFirst({
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
          'Another identification type with the same name or code already exists',
        );
      }
    }

    return this.prisma.identificationType.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    const inUse = await this.prisma.employee.count({
      where: { identificationTypeId: id, deletedAt: null },
    });
    if (inUse > 0) {
      throw new BadRequestException(
        'Cannot delete this identification type because employees still reference it',
      );
    }

    return this.prisma.identificationType.delete({ where: { id } });
  }
}
