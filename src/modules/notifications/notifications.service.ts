import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateNotificationDto, userId: string) {
    return this.prisma.notification.create({
      data: {
        userId,
        title: dto.title,
        desc: dto.desc,
        styleClass: dto.styleClass,
        icon: dto.icon,
        link: dto.link,
        isRead: dto.isRead ?? false,
        meta: (dto.meta ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findUnread(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId, deletedAt: null, isRead: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const row = await this.prisma.notification.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!row) {
      throw new NotFoundException('Notification not found');
    }
    return row;
  }

  async update(id: string, dto: UpdateNotificationDto, userId: string) {
    await this.findOne(id, userId);

    const { meta, ...rest } = dto;
    const data: Prisma.NotificationUpdateInput = {
      ...rest,
      ...(meta !== undefined
        ? { meta: meta as Prisma.InputJsonValue }
        : {}),
    };

    return this.prisma.notification.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.notification.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
