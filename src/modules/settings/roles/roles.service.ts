import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRoleDto) {
    const { permissionIds, ...rest } = dto;

    const existing = await this.prisma.role.findFirst({
      where: { name: rest.name },
    });
    if (existing) throw new ConflictException(`Role "${rest.name}" already exists`);

    return this.prisma.role.create({
      data: {
        name: rest.name,
        code: rest.code,
        isActive: rest.isActive ?? true,
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
      orderBy: { createdAt: 'desc' },
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

    await Promise.all(
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

    return this.findOne(id);
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

    await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });

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
