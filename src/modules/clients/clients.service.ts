import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClientDto, companyId: string) {
    return this.prisma.client.create({
      data: { ...dto, companyId },
      include: {
        clientType: true,
        clientFlag: true,
        country: true,
        region: true,
        currency: true,
        legalForm: true,
      },
    });
  }

  async findAll(companyId: string) {
    return this.prisma.client.findMany({
      where: { companyId, isActive: true, deletedAt: null },
      include: {
        clientType: true,
        clientFlag: true,
        country: true,
        region: true,
        currency: true,
        legalForm: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        clientType: true,
        clientFlag: true,
        country: true,
        region: true,
        currency: true,
        legalForm: true,
      },
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async update(id: string, dto: UpdateClientDto, companyId: string) {
    const client = await this.findOne(id, companyId);
    return this.prisma.client.update({
      where: { id: client.id },
      data: dto,
      include: {
        clientType: true,
        clientFlag: true,
        country: true,
        region: true,
        currency: true,
        legalForm: true,
      },
    });
  }

  async remove(id: string, companyId: string) {
    const client = await this.findOne(id, companyId);
    return this.prisma.client.update({
      where: { id: client.id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }
}