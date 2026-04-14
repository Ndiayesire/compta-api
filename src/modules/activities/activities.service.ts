import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateActivityDto, userId: string) {
    return this.prisma.activity.create({
      data: {
        userId,
        title: dto.title,
        styleClass: dto.styleClass,
        icon: dto.icon,
        desc: dto.desc,
        meta: (dto.meta ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.activity.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const row = await this.prisma.activity.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!row) {
      throw new NotFoundException('Activity not found');
    }
    return row;
  }

  async update(id: string, dto: UpdateActivityDto, userId: string) {
    await this.findOne(id, userId);

    const { meta, ...rest } = dto;
    const data: Prisma.ActivityUpdateInput = {
      ...rest,
      ...(meta !== undefined
        ? { meta: meta as Prisma.InputJsonValue }
        : {}),
    };

    return this.prisma.activity.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.activity.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
