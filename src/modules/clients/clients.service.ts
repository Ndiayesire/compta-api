import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

const clientInclude = {
  country: true,
  region: true,
  legalForm: true,
  user: {
    omit: { password: true, refreshToken: true },
  },
} satisfies Prisma.ClientInclude;

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClientDto, companyId: string, actingUserId: string) {
    const { user: contactUser, ...clientFields } = dto;

    if (contactUser) {
      const existing = await this.prisma.user.findUnique({
        where: { email: contactUser.email },
      });
      if (existing) {
        throw new ConflictException(`Email "${contactUser.email}" is already in use`);
      }

      const hashedPassword = await bcrypt.hash(contactUser.password, 10);

      return this.prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            email: contactUser.email,
            password: hashedPassword,
            firstName: contactUser.firstName ?? '',
            lastName: contactUser.lastName ?? '',
            phone: contactUser.phone ?? '',
            address: contactUser.address ?? '',
            avatar: contactUser.avatar ?? '',
            countryId: contactUser.countryId,
            regionId: contactUser.regionId,
            languageId: contactUser.languageId,
            genderId: contactUser.genderId,
            isActive: contactUser.isActive ?? true,
            roleId: contactUser.roleId,
          },
        });

        const client = await tx.client.create({
          data: {
            userId: createdUser.id,
            companyId,
            name: clientFields.name,
            address: clientFields.address,
            ninea: clientFields.ninea,
            useTva: clientFields.useTva ?? true,
            countryId: clientFields.countryId,
            regionId: clientFields.regionId,
            legalFormId: clientFields.legalFormId,
            meta: (clientFields.meta ?? {}) as Prisma.InputJsonValue,
          },
          include: clientInclude,
        });

        return client;
      });
    }

    const client = await this.prisma.client.create({
      data: {
        userId: actingUserId,
        companyId,
        name: clientFields.name,
        address: clientFields.address,
        ninea: clientFields.ninea,
        useTva: clientFields.useTva ?? true,
        countryId: clientFields.countryId,
        regionId: clientFields.regionId,
        legalFormId: clientFields.legalFormId,
        meta: (clientFields.meta ?? {}) as Prisma.InputJsonValue,
      },
      include: clientInclude,
    });

    return client;
  }

  async findAll(companyId: string) {
    return this.prisma.client.findMany({
      where: { companyId, deletedAt: null },
      include: clientInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, companyId, deletedAt: null },
      include: clientInclude,
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async update(id: string, dto: UpdateClientDto, companyId: string) {
    await this.findOne(id, companyId);

    const data: Prisma.ClientUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.ninea !== undefined) data.ninea = dto.ninea;
    if (dto.useTva !== undefined) data.useTva = dto.useTva;
    if (dto.countryId !== undefined) data.country = { connect: { id: dto.countryId } };
    if (dto.regionId !== undefined) data.region = { connect: { id: dto.regionId } };
    if (dto.legalFormId !== undefined) data.legalForm = { connect: { id: dto.legalFormId } };
    if (dto.meta !== undefined) data.meta = dto.meta as Prisma.InputJsonValue;

    const client = await this.prisma.client.update({
      where: { id },
      data,
      include: clientInclude,
    });
    return client;
  }

  async remove(id: string, companyId: string) {
    const client = await this.findOne(id, companyId);
    return this.prisma.client.update({
      where: { id: client.id },
      data: { deletedAt: new Date() },
    });
  }
}
