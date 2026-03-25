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
    const { roleId, password, ...rest } = dto;

    const existing = await this.prisma.user.findUnique({
      where: { email: rest.email },
    });
    if (existing) throw new ConflictException(`Email "${rest.email}" already exists`);

    const hashedPassword = await bcrypt.hash(password, 10);

    const data: any = {
      ...rest,
      password: hashedPassword,
    };
    if (roleId) data.role = { connect: { id: roleId } };

    return this.prisma.user.create({
      data,
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
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
        role: { include: { permissions: { include: { permission: true } } } },
        company: true,
      },
      omit: { password: true, refreshToken: true },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } },
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
        role: {
          include: {
            permissions: { include: { permission: true } },
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    const { roleId, password, ...rest } = dto;

    const data: any = { ...rest };
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }
    if (roleId !== undefined) {
      data.role = roleId ? { connect: { id: roleId } } : { disconnect: true };
    }

    return this.prisma.user.update({
      where: { id },
      data,
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
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

  async setRole(id: string, roleId: string) {
    await this.findOne(id);

    return this.prisma.user.update({
      where: { id },
      data: { role: { connect: { id: roleId } } },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
        company: true,
      },
      omit: { password: true, refreshToken: true },
    });
  }

  async unsetRole(id: string) {
    await this.findOne(id);

    return this.prisma.user.update({
      where: { id },
      data: { role: { disconnect: true } },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
        company: true,
      },
      omit: { password: true, refreshToken: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}