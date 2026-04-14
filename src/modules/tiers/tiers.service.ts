import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTierDto } from './dto/create-tier.dto';
import { UpdateTierDto } from './dto/update-tier.dto';

const tierInclude = {
  tierType: true,
  client: true,
} satisfies Prisma.TierInclude;

@Injectable()
export class TiersService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertClientInCompany(clientId: string, companyId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, companyId, deletedAt: null },
    });
    if (!client) {
      throw new BadRequestException(
        'Client not found or does not belong to your company',
      );
    }
    return client;
  }

  private async assertTierTypeExists(tierTypeId: string) {
    const tt = await this.prisma.tierType.findUnique({
      where: { id: tierTypeId },
    });
    if (!tt) {
      throw new BadRequestException('Invalid tier type');
    }
    return tt;
  }

  async create(dto: CreateTierDto, companyId: string) {
    await this.assertClientInCompany(dto.clientId, companyId);
    await this.assertTierTypeExists(dto.tierTypeId);

    return this.prisma.tier.create({
      data: {
        tierTypeId: dto.tierTypeId,
        clientId: dto.clientId,
        name: dto.name,
        ninea: dto.ninea,
        useTva: dto.useTva ?? true,
        reference: dto.reference,
        meta: (dto.meta ?? {}) as Prisma.InputJsonValue,
        isActive: dto.isActive ?? true,
      },
      include: tierInclude,
    });
  }

  async findAll(companyId: string) {
    return this.prisma.tier.findMany({
      where: {
        deletedAt: null,
        client: { companyId, deletedAt: null },
      },
      include: tierInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByClient(clientId: string, companyId: string) {
    await this.assertClientInCompany(clientId, companyId);

    return this.prisma.tier.findMany({
      where: {
        clientId,
        deletedAt: null,
      },
      include: tierInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const tier = await this.prisma.tier.findFirst({
      where: {
        id,
        deletedAt: null,
        client: { companyId, deletedAt: null },
      },
      include: tierInclude,
    });

    if (!tier) {
      throw new NotFoundException('Tier not found');
    }

    return tier;
  }

  async update(id: string, dto: UpdateTierDto, companyId: string) {
    await this.findOne(id, companyId);

    if (dto.clientId) {
      await this.assertClientInCompany(dto.clientId, companyId);
    }
    if (dto.tierTypeId) {
      await this.assertTierTypeExists(dto.tierTypeId);
    }

    const {
      tierTypeId,
      clientId,
      meta,
      ...rest
    } = dto;

    const data: Prisma.TierUpdateInput = {
      ...rest,
      ...(meta !== undefined
        ? { meta: meta as Prisma.InputJsonValue }
        : {}),
      ...(tierTypeId !== undefined
        ? { tierType: { connect: { id: tierTypeId } } }
        : {}),
      ...(clientId !== undefined
        ? { client: { connect: { id: clientId } } }
        : {}),
    };

    return this.prisma.tier.update({
      where: { id },
      data,
      include: tierInclude,
    });
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);

    return this.prisma.tier.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
