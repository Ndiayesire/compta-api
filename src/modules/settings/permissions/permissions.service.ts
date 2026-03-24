// src/permissions/permissions.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePermissionDto) {
    const existing = await this.prisma.permission.findUnique({
      where: { name: dto.name },
    });
    if (existing) throw new ConflictException(`Permission "${dto.name}" already exists`);

    return this.prisma.permission.create({ data: dto });
  }

  async findAll() {
    return this.prisma.permission.findMany({
      where: { isActive: true },
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });
  }

  async findByModule(module: string) {
    return this.prisma.permission.findMany({
      where: { module, isActive: true },
      orderBy: { action: 'asc' },
    });
  }

  async findOne(id: string) {
    const permission = await this.prisma.permission.findUnique({ where: { id } });
    if (!permission) throw new NotFoundException(`Permission ${id} not found`);
    return permission;
  }

  async update(id: string, dto: UpdatePermissionDto) {
    await this.findOne(id);
    return this.prisma.permission.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.permission.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // async seed() {
  //   const permissions = [
  //     // Company
  //     { name: 'company:create', module: 'company', action: 'create', description: 'Créer une entreprise' },
  //     { name: 'company:read',   module: 'company', action: 'read',   description: 'Voir les entreprises' },
  //     { name: 'company:update', module: 'company', action: 'update', description: 'Modifier une entreprise' },
  //     { name: 'company:delete', module: 'company', action: 'delete', description: 'Supprimer une entreprise' },
  //     // Users
  //     { name: 'user:create', module: 'user', action: 'create', description: 'Créer un utilisateur' },
  //     { name: 'user:read',   module: 'user', action: 'read',   description: 'Voir les utilisateurs' },
  //     { name: 'user:update', module: 'user', action: 'update', description: 'Modifier un utilisateur' },
  //     { name: 'user:delete', module: 'user', action: 'delete', description: 'Supprimer un utilisateur' },
  //     // Roles
  //     { name: 'role:create', module: 'role', action: 'create', description: 'Créer un rôle' },
  //     { name: 'role:read',   module: 'role', action: 'read',   description: 'Voir les rôles' },
  //     { name: 'role:update', module: 'role', action: 'update', description: 'Modifier un rôle' },
  //     { name: 'role:delete', module: 'role', action: 'delete', description: 'Supprimer un rôle' },
  //     // Permissions
  //     { name: 'permission:create', module: 'permission', action: 'create', description: 'Créer une permission' },
  //     { name: 'permission:read',   module: 'permission', action: 'read',   description: 'Voir les permissions' },
  //     { name: 'permission:update', module: 'permission', action: 'update', description: 'Modifier une permission' },
  //     { name: 'permission:delete', module: 'permission', action: 'delete', description: 'Supprimer une permission' },
  //     // Countries
  //     { name: 'country:create', module: 'country', action: 'create', description: 'Créer un pays' },
  //     { name: 'country:read',   module: 'country', action: 'read',   description: 'Voir les pays' },
  //     { name: 'country:update', module: 'country', action: 'update', description: 'Modifier un pays' },
  //     { name: 'country:delete', module: 'country', action: 'delete', description: 'Supprimer un pays' },
  //     // Regions
  //     { name: 'region:create', module: 'region', action: 'create', description: 'Créer une région' },
  //     { name: 'region:read',   module: 'region', action: 'read',   description: 'Voir les régions' },
  //     { name: 'region:update', module: 'region', action: 'update', description: 'Modifier une région' },
  //     { name: 'region:delete', module: 'region', action: 'delete', description: 'Supprimer une région' },
  //     // Payment Methods
  //     { name: 'payment-method:create', module: 'payment-method', action: 'create', description: 'Créer une méthode de paiement' },
  //     { name: 'payment-method:read',   module: 'payment-method', action: 'read',   description: 'Voir les méthodes de paiement' },
  //     { name: 'payment-method:update', module: 'payment-method', action: 'update', description: 'Modifier une méthode de paiement' },
  //     { name: 'payment-method:delete', module: 'payment-method', action: 'delete', description: 'Supprimer une méthode de paiement' },
  //   ];

  //   const data = await Promise.all(
  //     permissions.map((p) =>
  //       this.prisma.permission.upsert({
  //         where: { name: p.name },
  //         update: {},
  //         create: p,
  //       }),
  //     ),
  //   );

  //   return data;
  // }
}