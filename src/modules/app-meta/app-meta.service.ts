import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAppMetaDto } from './dto/create-app-meta.dto';
import { UpdateAppMetaDto } from './dto/update-app-meta.dto';

@Injectable()
export class AppMetaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAppMetaDto) {
    const existing = await this.prisma.appMeta.findFirst({
      where: { key: dto.key, deletedAt: null },
    });
    if (existing) {
      throw new BadRequestException(
        `A meta entry with key "${dto.key}" already exists`,
      );
    }
    return this.prisma.appMeta.create({
      data: { key: dto.key, value: dto.value },
    });
  }

  async findAll() {
    return this.prisma.appMeta.findMany({
      where: { deletedAt: null },
      orderBy: { key: 'asc' },
    });
  }

  async findOne(id: number) {
    const row = await this.prisma.appMeta.findFirst({
      where: { id, deletedAt: null },
    });
    if (!row) {
      throw new NotFoundException('Meta entry not found');
    }
    return row;
  }

  async findByKey(key: string) {
    const row = await this.prisma.appMeta.findFirst({
      where: { key, deletedAt: null },
    });
    if (!row) {
      throw new NotFoundException('Meta entry not found');
    }
    return row;
  }

  async update(id: number, dto: UpdateAppMetaDto) {
    await this.findOne(id);
    if (dto.key) {
      const dup = await this.prisma.appMeta.findFirst({
        where: {
          key: dto.key,
          deletedAt: null,
          id: { not: id },
        },
      });
      if (dup) {
        throw new BadRequestException(
          `Another meta entry already uses key "${dto.key}"`,
        );
      }
    }
    return this.prisma.appMeta.update({
      where: { id },
      data: {
        ...(dto.key !== undefined ? { key: dto.key } : {}),
        ...(dto.value !== undefined ? { value: dto.value } : {}),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.appMeta.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
