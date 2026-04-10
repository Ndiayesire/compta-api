import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateGenderDto } from './dto/create-gender.dto';
import { UpdateGenderDto } from './dto/update-gender.dto';

@Injectable()
export class GendersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateGenderDto) {
    const existing = await this.prisma.gender.findFirst({
      where: {
        OR: [{ code: dto.code }, { name: dto.name }],
      },
    });

    if (existing) {
      throw new BadRequestException(
        'A gender with the same name or code already exists',
      );
    }

    return this.prisma.gender.create({ data: dto });
  }

  async findAll() {
    return this.prisma.gender.findMany({
      orderBy: { code: 'asc' },
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.gender.findUnique({
      where: { id },
    });

    if (!row) {
      throw new NotFoundException('Gender not found');
    }

    return row;
  }

  async update(id: string, dto: UpdateGenderDto) {
    await this.findOne(id);

    if (dto.code || dto.name) {
      const duplicate = await this.prisma.gender.findFirst({
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
          'Another gender with the same name or code already exists',
        );
      }
    }

    return this.prisma.gender.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    const used = await this.prisma.user.count({
      where: { genderId: id, deletedAt: null },
    });

    if (used > 0) {
      throw new BadRequestException(
        'Cannot deactivate this gender because users are still assigned to it',
      );
    }

    return this.prisma.gender.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
