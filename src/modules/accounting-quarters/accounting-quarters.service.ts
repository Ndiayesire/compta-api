import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAccountingQuarterDto } from './dto/create-accounting-quarter.dto';
import { UpdateAccountingQuarterDto } from './dto/update-accounting-quarter.dto';

@Injectable()
export class AccountingQuartersService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertYearExists(accountingYearId: string) {
    const y = await this.prisma.accountingYear.findFirst({
      where: { id: accountingYearId, deletedAt: null },
    });
    if (!y) {
      throw new BadRequestException('Accounting year not found or inactive');
    }
    return y;
  }

  async create(dto: CreateAccountingQuarterDto) {
    await this.assertYearExists(dto.accountingYearId);
    const start = new Date(dto.monthStartDate);
    const end = new Date(dto.endDate);
    if (start >= end) {
      throw new BadRequestException(
        'monthStartDate must be strictly before endDate',
      );
    }
    return this.prisma.accountingQuarter.create({
      data: {
        accountingYearId: dto.accountingYearId,
        name: dto.name,
        monthStartDate: start,
        endDate: end,
        isActive: dto.isActive ?? true,
      },
      include: { accountingYear: true },
    });
  }

  async findAll(accountingYearId?: string) {
    return this.prisma.accountingQuarter.findMany({
      where: {
        deletedAt: null,
        ...(accountingYearId ? { accountingYearId } : {}),
      },
      include: { accountingYear: true },
      orderBy: { monthStartDate: 'asc' },
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.accountingQuarter.findFirst({
      where: { id, deletedAt: null },
      include: { accountingYear: true },
    });
    if (!row) {
      throw new NotFoundException('Accounting quarter not found');
    }
    return row;
  }

  async update(id: string, dto: UpdateAccountingQuarterDto) {
    await this.findOne(id);
    if (dto.accountingYearId) {
      await this.assertYearExists(dto.accountingYearId);
    }
    const existing = await this.prisma.accountingQuarter.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Accounting quarter not found');
    }
    const start =
      dto.monthStartDate !== undefined
        ? new Date(dto.monthStartDate)
        : existing.monthStartDate;
    const end =
      dto.endDate !== undefined ? new Date(dto.endDate) : existing.endDate;
    if (start >= end) {
      throw new BadRequestException(
        'monthStartDate must be strictly before endDate',
      );
    }
    return this.prisma.accountingQuarter.update({
      where: { id },
      data: {
        ...(dto.accountingYearId !== undefined
          ? { accountingYearId: dto.accountingYearId }
          : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.monthStartDate !== undefined
          ? { monthStartDate: new Date(dto.monthStartDate) }
          : {}),
        ...(dto.endDate !== undefined
          ? { endDate: new Date(dto.endDate) }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      include: { accountingYear: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.accountingQuarter.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
