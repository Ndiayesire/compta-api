import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateBalanceDto } from './dto/create-balance.dto';
import { UpdateBalanceDto } from './dto/update-balance.dto';
import { UpdateBalanceLineDto } from './dto/update-balance-line.dto';
import { parseBalanceLineImportWorkbook } from './balance-line-excel-import';

const balanceInclude = {
  accountingYear: true,
  client: true,
} satisfies Prisma.BalanceInclude;

const balanceLineInclude = {
  balance: {
    include: { client: true, accountingYear: true },
  },
} satisfies Prisma.BalanceLineInclude;

@Injectable()
export class BalancesService {
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

  private async assertAccountingYear(accountingYearId: string) {
    const y = await this.prisma.accountingYear.findFirst({
      where: { id: accountingYearId, deletedAt: null },
    });
    if (!y) {
      throw new BadRequestException('Accounting year not found');
    }
    return y;
  }

  private assertDatesWithinYear(
    start: Date,
    end: Date,
    yearStart: Date,
    yearEnd: Date,
  ) {
    const ys = new Date(yearStart);
    const ye = new Date(yearEnd);
    ys.setHours(0, 0, 0, 0);
    ye.setHours(23, 59, 59, 999);
    if (start < ys || end > ye) {
      throw new BadRequestException(
        'Balance period must fall within the accounting year dates',
      );
    }
  }

  async assertBalanceInCompany(balanceId: string, companyId: string) {
    const b = await this.prisma.balance.findFirst({
      where: {
        id: balanceId,
        deletedAt: null,
        client: { companyId, deletedAt: null },
      },
      include: balanceInclude,
    });
    if (!b) {
      throw new BadRequestException(
        'Balance not found or does not belong to your company',
      );
    }
    return b;
  }

  async createBalance(dto: CreateBalanceDto, companyId: string) {
    await this.assertClientInCompany(dto.clientId, companyId);
    const year = await this.assertAccountingYear(dto.accountingYearId);
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (start >= end) {
      throw new BadRequestException(
        'startDate must be strictly before endDate',
      );
    }
    this.assertDatesWithinYear(start, end, year.startDate, year.endDate);

    return this.prisma.balance.create({
      data: {
        accountingYearId: dto.accountingYearId,
        clientId: dto.clientId,
        startDate: start,
        endDate: end,
        isActive: dto.isActive ?? true,
      },
      include: balanceInclude,
    });
  }

  async findAllBalances(companyId: string, clientId?: string) {
    return this.prisma.balance.findMany({
      where: {
        deletedAt: null,
        client: {
          companyId,
          deletedAt: null,
          ...(clientId ? { id: clientId } : {}),
        },
      },
      include: balanceInclude,
      orderBy: { startDate: 'desc' },
    });
  }

  async findOneBalance(id: string, companyId: string) {
    const row = await this.prisma.balance.findFirst({
      where: {
        id,
        deletedAt: null,
        client: { companyId, deletedAt: null },
      },
      include: balanceInclude,
    });
    if (!row) {
      throw new NotFoundException('Balance not found');
    }
    return row;
  }

  async updateBalance(id: string, dto: UpdateBalanceDto, companyId: string) {
    const existing = await this.findOneBalance(id, companyId);
    const year = await this.assertAccountingYear(existing.accountingYearId);
    const start =
      dto.startDate !== undefined
        ? new Date(dto.startDate)
        : existing.startDate;
    const end =
      dto.endDate !== undefined ? new Date(dto.endDate) : existing.endDate;
    if (start >= end) {
      throw new BadRequestException(
        'startDate must be strictly before endDate',
      );
    }
    this.assertDatesWithinYear(start, end, year.startDate, year.endDate);

    return this.prisma.balance.update({
      where: { id },
      data: {
        ...(dto.startDate !== undefined ? { startDate: start } : {}),
        ...(dto.endDate !== undefined ? { endDate: end } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      include: balanceInclude,
    });
  }

  async removeBalance(id: string, companyId: string) {
    await this.findOneBalance(id, companyId);
    await this.prisma.$transaction([
      this.prisma.balanceLine.updateMany({
        where: { balanceId: id, deletedAt: null },
        data: { deletedAt: new Date() },
      }),
      this.prisma.balance.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
    ]);
    return this.prisma.balance.findFirst({
      where: { id },
      include: balanceInclude,
    });
  }

  async importBalanceLinesFromExcel(
    balanceId: string,
    companyId: string,
    buffer: Buffer,
  ) {
    await this.assertBalanceInCompany(balanceId, companyId);
    let parsed: Awaited<ReturnType<typeof parseBalanceLineImportWorkbook>>;
    try {
      parsed = await parseBalanceLineImportWorkbook(buffer);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new BadRequestException(msg);
    }

    const errors: { row: number; message: string }[] = [];
    const created: Awaited<ReturnType<typeof this.prisma.balanceLine.create>>[] =
      [];

    for (const item of parsed) {
      if ('error' in item) {
        errors.push({ row: item.rowNumber, message: item.error });
        continue;
      }
      try {
        const row = await this.prisma.balanceLine.create({
          data: {
            balanceId,
            number: item.number,
            name: item.name,
            previousSold: new Prisma.Decimal(String(item.previousSold)),
            previousIsDebit: item.previousIsDebit,
            debit: new Prisma.Decimal(String(item.debit)),
            credit: new Prisma.Decimal(String(item.credit)),
            currentSold: new Prisma.Decimal(String(item.currentSold)),
            currentIsDebit: item.currentIsDebit,
          },
          include: balanceLineInclude,
        });
        created.push(row);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        errors.push({ row: item.rowNumber, message });
      }
    }

    return {
      createdCount: created.length,
      failedCount: errors.length,
      created,
      errors,
    };
  }

  async findAllBalanceLines(balanceId: string, companyId: string) {
    await this.assertBalanceInCompany(balanceId, companyId);
    return this.prisma.balanceLine.findMany({
      where: { balanceId, deletedAt: null },
      orderBy: { number: 'asc' },
      include: { balance: { include: { client: true } } },
    });
  }

  async findOneBalanceLine(id: string, companyId: string) {
    const row = await this.prisma.balanceLine.findFirst({
      where: {
        id,
        deletedAt: null,
        balance: {
          deletedAt: null,
          client: { companyId, deletedAt: null },
        },
      },
      include: balanceLineInclude,
    });
    if (!row) {
      throw new NotFoundException('Balance line not found');
    }
    return row;
  }

  async updateBalanceLine(
    id: string,
    dto: UpdateBalanceLineDto,
    companyId: string,
  ) {
    await this.findOneBalanceLine(id, companyId);
    return this.prisma.balanceLine.update({
      where: { id },
      data: {
        ...(dto.number !== undefined ? { number: dto.number } : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.previousSold !== undefined
          ? { previousSold: new Prisma.Decimal(String(dto.previousSold)) }
          : {}),
        ...(dto.previousIsDebit !== undefined
          ? { previousIsDebit: dto.previousIsDebit }
          : {}),
        ...(dto.debit !== undefined
          ? { debit: new Prisma.Decimal(String(dto.debit)) }
          : {}),
        ...(dto.credit !== undefined
          ? { credit: new Prisma.Decimal(String(dto.credit)) }
          : {}),
        ...(dto.currentSold !== undefined
          ? { currentSold: new Prisma.Decimal(String(dto.currentSold)) }
          : {}),
        ...(dto.currentIsDebit !== undefined
          ? { currentIsDebit: dto.currentIsDebit }
          : {}),
      },
      include: balanceLineInclude,
    });
  }

  async removeBalanceLine(id: string, companyId: string) {
    await this.findOneBalanceLine(id, companyId);
    return this.prisma.balanceLine.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: balanceLineInclude,
    });
  }
}
