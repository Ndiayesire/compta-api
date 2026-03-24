// src/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const { roleIds, password, ...rest } = dto;

    const existing = await this.prisma.user.findUnique({
      where: { email: rest.email },
    });
    if (existing) throw new ConflictException(`Email "${rest.email}" already exists`);

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        ...rest,
        password: hashedPassword,
        roles: roleIds?.length
          ? {
              create: roleIds.map((roleId) => ({
                role: { connect: { id: roleId } },
              })),
            }
          : undefined,
      },
      include: {
        roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
        company: true,
      },
    });
  }

  async findAll(companyId?: string) {
    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        ...(companyId && { companyId }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
        company: true,
      },
      omit: { password: true, refreshToken: true },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
        company: true,
      },
      omit: { password: true, refreshToken: true },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    const { roleIds, password, ...rest } = dto;

    const data: any = { ...rest };
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      include: {
        roles: { include: { role: true } },
        company: true,
      },
      omit: { password: true, refreshToken: true },
    });
  }

  async changePassword(id: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) throw new BadRequestException('Current password is incorrect');

    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('New password and confirm password do not match');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  async addRoles(id: string, roleIds: string[]) {
    await this.findOne(id);

    await Promise.all(
      roleIds.map((roleId) =>
        this.prisma.userRole.upsert({
          where: { userId_roleId: { userId: id, roleId } },
          update: {},
          create: { userId: id, roleId },
        }),
      ),
    );

    return this.findOne(id);
  }

  async removeRoles(id: string, roleIds: string[]) {
    await this.findOne(id);

    await this.prisma.userRole.deleteMany({
      where: { userId: id, roleId: { in: roleIds } },
    });

    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}