// src/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

const userInclude = {
  role: { include: { permissions: { include: { permission: true } } } },
  companies: true,
} as const;

function withCompany<T extends { companies: { id: string }[] }>(user: T) {
  const { companies, ...rest } = user;
  return { ...rest, company: companies[0] ?? null };
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const { roleId, password, ...rest } = dto;

    const existing = await this.prisma.user.findUnique({
      where: { email: rest.email },
    });
    if (existing) throw new ConflictException(`Email "${rest.email}" already exists`);

    if (!roleId) {
      throw new BadRequestException('roleId is required');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const created = await this.prisma.user.create({
      data: {
        email: rest.email,
        password: hashedPassword,
        firstName: rest.firstName ?? '',
        lastName: rest.lastName ?? '',
        phone: rest.phone ?? '',
        address: rest.address ?? '',
        avatar: rest.avatar ?? '',
        countryId: rest.countryId,
        regionId: rest.regionId,
        languageId: rest.languageId,
        genderId: rest.genderId,
        isActive: rest.isActive ?? true,
        roleId,
      },
      include: userInclude,
    });

    return withCompany(created);
  }

  async findAll(companyId?: string) {
    const rows = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        ...(companyId && { companies: { some: { id: companyId } } }),
      },
      orderBy: { createdAt: 'desc' },
      include: userInclude,
      omit: { password: true, refreshToken: true },
    });
    return rows.map(withCompany);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: userInclude,
      omit: { password: true, refreshToken: true },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return withCompany(user);
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

    const data: Prisma.UserUncheckedUpdateInput = { ...rest };
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }
    if (roleId !== undefined) {
      if (!roleId) {
        throw new BadRequestException('roleId cannot be cleared; assign another role instead');
      }
      data.roleId = roleId;
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      include: userInclude,
      omit: { password: true, refreshToken: true },
    });
    return withCompany(updated);
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

    const updated = await this.prisma.user.update({
      where: { id },
      data: { roleId },
      include: userInclude,
      omit: { password: true, refreshToken: true },
    });
    return withCompany(updated);
  }

  async unsetRole(_id: string) {
    throw new BadRequestException('A role is required for every user');
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
