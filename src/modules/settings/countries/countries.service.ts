// src/countries/countries.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';

@Injectable()
export class CountriesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCountryDto) {
    return this.prisma.country.create({
      data: dto,
      include: { region: true },
    });
  }

  findAll() {
    return this.prisma.country.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: { region: true },
    });
  }

  async findOne(id: string) {
    const country = await this.prisma.country.findUnique({
      where: { id },
      include: { region: true },
    });
    if (!country) throw new NotFoundException(`Country ${id} not found`);
    return country;
  }

  async update(id: string, dto: UpdateCountryDto) {
    await this.findOne(id);
    return this.prisma.country.update({
      where: { id },
      data: dto,
      include: { region: true },
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