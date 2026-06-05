import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProviderDto) {
    return this.prisma.provider.create({ data: dto });
  }

  async findAll() {
    return this.prisma.provider.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.provider.findFirst({
      where: { id, deletedAt: null },
    });
    if (!row) {
      throw new NotFoundException('Provider not found');
    }
    return row;
  }

  async update(id: string, dto: UpdateProviderDto) {
    await this.findOne(id);
    return this.prisma.provider.update({
      where: { id },
      data: {
        ...(dto.ninea !== undefined ? { ninea: dto.ninea } : {}),
        ...(dto.cofi !== undefined ? { cofi: dto.cofi } : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    const used = await this.prisma.opLocalPurchase.count({
      where: { providerId: id, deletedAt: null },
    });
    if (used > 0) {
      throw new BadRequestException('Cannot delete provider while local purchases reference it');
    }
    return this.prisma.provider.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
