import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAccountingYearDto } from './dto/create-accounting-year.dto';
import { UpdateAccountingYearDto } from './dto/update-accounting-year.dto';

@Injectable()
export class AccountingYearsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAccountingYearDto) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (start >= end) {
      throw new BadRequestException(
        'startDate must be strictly before endDate',
      );
    }
    return this.prisma.accountingYear.create({
      data: {
        name: dto.name,
        startDate: start,
        endDate: end,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll() {
    return this.prisma.accountingYear.findMany({
      where: { deletedAt: null },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.accountingYear.findFirst({
      where: { id, deletedAt: null },
    });
    if (!row) {
      throw new NotFoundException('Accounting year not found');
    }
    return row;
  }

  async update(id: string, dto: UpdateAccountingYearDto) {
    await this.findOne(id);
    const start =
      dto.startDate !== undefined ? new Date(dto.startDate) : undefined;
    const end = dto.endDate !== undefined ? new Date(dto.endDate) : undefined;
    const existing = await this.prisma.accountingYear.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Accounting year not found');
    }
    const nextStart = start ?? existing.startDate;
    const nextEnd = end ?? existing.endDate;
    if (nextStart >= nextEnd) {
      throw new BadRequestException(
        'startDate must be strictly before endDate',
      );
    }
    return this.prisma.accountingYear.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(start !== undefined ? { startDate: start } : {}),
        ...(end !== undefined ? { endDate: end } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    const quarterCount = await this.prisma.accountingQuarter.count({
      where: { accountingYearId: id, deletedAt: null },
    });
    if (quarterCount > 0) {
      throw new BadRequestException(
        'Cannot delete this accounting year while quarters still reference it',
      );
    }
    return this.prisma.accountingYear.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
