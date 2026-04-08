import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';

@Injectable()
export class CurrencyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCurrencyDto) {
    try {
      return await this.prisma.currency.create({
        data: {
          code: dto.code.toUpperCase(),
          name: dto.name,
          symbol: dto.symbol,
          decimals: dto.decimals ?? 0,
          isPrefix: dto.isPrefix ?? false,
        },
      });
    } catch (error : any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Currency code already exists');
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.currency.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const currency = await this.prisma.currency.findUnique({
      where: { id },
    });

    if (!currency) {
      throw new NotFoundException('Currency not found');
    }

    return currency;
  }

  async findByCode(code: string) {
    const currency = await this.prisma.currency.findUnique({
      where: {
        code: code.toUpperCase(),
      },
    });

    if (!currency || !currency.isActive) {
      throw new NotFoundException('Currency not found or inactive');
    }

    return currency;
  }

  async update(id: string, dto: UpdateCurrencyDto) {
    await this.findOne(id);

    try {
      return await this.prisma.currency.update({
        where: { id },
        data: {
          ...(dto.code && { code: dto.code.toUpperCase() }),
          ...(dto.name && { name: dto.name }),
          ...(dto.symbol !== undefined && { symbol: dto.symbol }),
          ...(dto.decimals !== undefined && { decimals: dto.decimals }),
          ...(dto.isPrefix !== undefined && { isPrefix: dto.isPrefix }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        },
      });
    } catch (error : any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Currency code already exists');
      }
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.currency.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  async activate(id: string) {
    await this.findOne(id);

    return this.prisma.currency.update({
      where: { id },
      data: {
        isActive: true,
      },
    });
  }
}