import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateLanguageDto } from './dto/create-language.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';

const languageInclude = {
  country: true,
} satisfies Prisma.LanguageInclude;

@Injectable()
export class LanguagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLanguageDto) {
    const existing = await this.prisma.language.findFirst({
      where: {
        OR: [{ code: dto.code }, { name: dto.name }],
      },
    });

    if (existing) {
      throw new BadRequestException(
        'A language with the same name or code already exists',
      );
    }

    return this.prisma.language.create({
      data: {
        countryId: dto.countryId,
        name: dto.name,
        code: dto.code,
        isActive: dto.isActive ?? true,
      },
      include: languageInclude,
    });
  }

  async findAll() {
    return this.prisma.language.findMany({
      orderBy: { code: 'asc' },
      include: languageInclude,
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.language.findUnique({
      where: { id },
      include: languageInclude,
    });

    if (!row) {
      throw new NotFoundException('Language not found');
    }

    return row;
  }

  async update(id: string, dto: UpdateLanguageDto) {
    await this.findOne(id);

    if (dto.code || dto.name) {
      const duplicate = await this.prisma.language.findFirst({
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
          'Another language with the same name or code already exists',
        );
      }
    }

    const { countryId, ...scalar } = dto;

    const data: Prisma.LanguageUpdateInput = {
      ...scalar,
      ...(countryId !== undefined
        ? { country: { connect: { id: countryId } } }
        : {}),
    };

    return this.prisma.language.update({
      where: { id },
      data,
      include: languageInclude,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    const used = await this.prisma.user.count({
      where: { languageId: id, deletedAt: null },
    });

    if (used > 0) {
      throw new BadRequestException(
        'Cannot deactivate this language because users are still assigned to it',
      );
    }

    return this.prisma.language.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
