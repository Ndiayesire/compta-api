import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';

@Injectable()
export class CountriesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCountryDto) {
    return this.prisma.country.create({
      data: {
        currencyId: dto.currencyId,
        name: dto.name,
        code: dto.code,
        tva: dto.tva,
        callingCode: dto.callingCode,
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      include: { regions: true, currency: true },
    });
  }

  findAll() {
    return this.prisma.country.findMany({
      orderBy: { name: 'asc' },
      include: {
        regions: {
          orderBy: { name: 'asc' },
        },
        currency: true,
      },
    });
  }

  async findOne(id: string) {
    const country = await this.prisma.country.findUnique({
      where: { id },
      include: { regions: true, currency: true },
    });
    if (!country) throw new NotFoundException(`Country ${id} not found`);
    return country;
  }

  async update(id: string, dto: UpdateCountryDto) {
    await this.findOne(id);
    return this.prisma.country.update({
      where: { id },
      data: {
        ...(dto.currencyId !== undefined && { currencyId: dto.currencyId }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.tva !== undefined && { tva: dto.tva }),
        ...(dto.callingCode !== undefined && { callingCode: dto.callingCode }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: { regions: true, currency: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.country.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
