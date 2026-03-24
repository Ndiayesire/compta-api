// src/roles/roles.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRoleDto) {
    const { permissionIds, ...rest } = dto;

    const existing = await this.prisma.role.findUnique({
      where: { name: rest.name },
    });
    if (existing) throw new ConflictException(`Role "${rest.name}" already exists`);

    return this.prisma.role.create({
      data: {
        ...rest,
        permissions: permissionIds?.length
          ? {
              create: permissionIds.map((permissionId) => ({
                permission: { connect: { id: permissionId } },
              })),
            }
          : undefined,
      },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.role.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    return role;
  }

  async update(id: string, dto: UpdateRoleDto) {
    await this.findOne(id);
    const { permissionIds, ...rest } = dto;

    // Sync permissions si fournis
    if (permissionIds) {
      await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        ...rest,
        permissions: permissionIds?.length
          ? {
              create: permissionIds.map((permissionId) => ({
                permission: { connect: { id: permissionId } },
              })),
            }
          : undefined,
      },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.role.update({
      where: { id },
      data: { isActive: false },
    });
  }

  
  async addPermissions(id: string, permissionIds: string[]) {
    await this.findOne(id);

    const data = await Promise.all(
      permissionIds.map((permissionId) =>
        this.prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: { roleId: id, permissionId },
          },
          update: {},
          create: { roleId: id, permissionId },
        }),
      ),
    );

    return this.findOne(id); // retourne le rôle avec toutes ses permissions
  }

  async removePermissions(id: string, permissionIds: string[]) {
    await this.findOne(id);

    await this.prisma.rolePermission.deleteMany({
      where: {
        roleId: id,
        permissionId: { in: permissionIds },
      },
    });

    return this.findOne(id);
  }

  async syncPermissions(id: string, permissionIds: string[]) {
    await this.findOne(id);

    // Supprime toutes les permissions existantes
    await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });

    // Recrée avec les nouvelles
    await Promise.all(
      permissionIds.map((permissionId) =>
        this.prisma.rolePermission.create({
          data: { roleId: id, permissionId },
        }),
      ),
    );

    return this.findOne(id);
  }
}