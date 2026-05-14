import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateRentalUsageDto } from './dto/create-rental-usage.dto';
import { UpdateRentalUsageDto } from './dto/update-rental-usage.dto';

@Injectable()
export class RentalUsagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRentalUsageDto) {
    return this.prisma.rentalUsage.create({
      data: {
        name: dto.name,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll() {
    return this.prisma.rentalUsage.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.rentalUsage.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException('Rental usage not found');
    }
    return row;
  }

  async update(id: string, dto: UpdateRentalUsageDto) {
    await this.findOne(id);
    return this.prisma.rentalUsage.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    const count = await this.prisma.rental.count({
      where: { rentalUsageId: id, deletedAt: null },
    });
    if (count > 0) {
      throw new BadRequestException(
        'Cannot delete this rental usage while rentals still reference it',
      );
    }
    return this.prisma.rentalUsage.delete({ where: { id } });
  }
}
