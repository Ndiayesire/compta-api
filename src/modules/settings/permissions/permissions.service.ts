// src/permissions/permissions.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePermissionDto) {
    const existing = await this.prisma.permission.findFirst({
      where: { name: dto.name },
    });
    if (existing) throw new ConflictException(`Permission "${dto.name}" already exists`);

    return this.prisma.permission.create({
      data: {
        typeId: dto.typeId,
        name: dto.name,
        code: dto.code,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll() {
    return this.prisma.permission.findMany({
      orderBy: { code: 'asc' },
      include: { type: true },
    });
  }

  async findByTypeId(typeId: string) {
    return this.prisma.permission.findMany({
      where: { typeId },
      orderBy: { code: 'asc' },
      include: { type: true },
    });
  }

  async findOne(id: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      include: { type: true },
    });
    if (!permission) throw new NotFoundException(`Permission ${id} not found`);
    return permission;
  }

  async update(id: string, dto: UpdatePermissionDto) {
    await this.findOne(id);
    const { typeId, ...rest } = dto;
    return this.prisma.permission.update({
      where: { id },
      data: {
        ...rest,
        ...(typeId !== undefined ? { type: { connect: { id: typeId } } } : {}),
      },
      include: { type: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.permission.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
