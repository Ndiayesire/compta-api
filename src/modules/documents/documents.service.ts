import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

const documentInclude = {
  category: true,
  company: true,
} satisfies Prisma.DocumentInclude;

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertCategoryUsable(categoryId: string) {
    const cat = await this.prisma.documentCategory.findFirst({
      where: { id: categoryId, deletedAt: null },
    });
    if (!cat) {
      throw new BadRequestException('Invalid or inactive document category');
    }
    return cat;
  }

  async create(dto: CreateDocumentDto, companyId: string) {
    await this.assertCategoryUsable(dto.categoryId);

    return this.prisma.document.create({
      data: {
        categoryId: dto.categoryId,
        companyId,
        name: dto.name,
        path: dto.path,
        mimeType: dto.mimeType,
        size: dto.size,
        meta: (dto.meta ?? {}) as Prisma.InputJsonValue,
      },
      include: documentInclude,
    });
  }

  async findAll(companyId: string) {
    return this.prisma.document.findMany({
      where: {
        companyId,
        deletedAt: null,
      },
      include: documentInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const doc = await this.prisma.document.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
      include: documentInclude,
    });

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    return doc;
  }

  async update(id: string, dto: UpdateDocumentDto, companyId: string) {
    await this.findOne(id, companyId);

    if (dto.categoryId) {
      await this.assertCategoryUsable(dto.categoryId);
    }

    const { categoryId, meta, ...rest } = dto;

    const data: Prisma.DocumentUpdateInput = {
      ...rest,
      ...(meta !== undefined
        ? { meta: meta as Prisma.InputJsonValue }
        : {}),
      ...(categoryId !== undefined
        ? { category: { connect: { id: categoryId } } }
        : {}),
    };

    return this.prisma.document.update({
      where: { id },
      data,
      include: documentInclude,
    });
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);

    return this.prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
