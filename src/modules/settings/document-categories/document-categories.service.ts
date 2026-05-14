import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateDocumentCategoryDto } from './dto/create-document-category.dto';
import { UpdateDocumentCategoryDto } from './dto/update-document-category.dto';

@Injectable()
export class DocumentCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDocumentCategoryDto) {
    const existing = await this.prisma.documentCategory.findFirst({
      where: {
        deletedAt: null,
        OR: [{ code: dto.code }, { name: dto.name }],
      },
    });

    if (existing) {
      throw new BadRequestException(
        'A document category with the same name or code already exists',
      );
    }

    return this.prisma.documentCategory.create({
      data: {
        name: dto.name,
        code: dto.code,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll() {
    return this.prisma.documentCategory.findMany({
      where: { deletedAt: null },
      orderBy: { code: 'asc' },
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.documentCategory.findFirst({
      where: { id, deletedAt: null },
    });

    if (!row) {
      throw new NotFoundException('Document category not found');
    }

    return row;
  }

  async update(id: string, dto: UpdateDocumentCategoryDto) {
    await this.findOne(id);

    if (dto.code || dto.name) {
      const duplicate = await this.prisma.documentCategory.findFirst({
        where: {
          deletedAt: null,
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
          'Another document category with the same name or code already exists',
        );
      }
    }

    return this.prisma.documentCategory.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    const used = await this.prisma.document.count({
      where: { categoryId: id, deletedAt: null },
    });

    if (used > 0) {
      throw new BadRequestException(
        'Cannot delete this category because documents still reference it',
      );
    }

    return this.prisma.documentCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
