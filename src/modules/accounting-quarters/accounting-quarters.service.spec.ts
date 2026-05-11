import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../common/testing/prisma-mock';
import { AccountingQuartersService } from './accounting-quarters.service';

describe('AccountingQuartersService (CRUD mocké)', () => {
  let service: AccountingQuartersService;
  let prisma: PrismaService;

  const p = () =>
    prisma as unknown as {
      accountingYear: { findFirst: jest.Mock };
      accountingQuarter: {
        create: jest.Mock;
        findMany: jest.Mock;
        findFirst: jest.Mock;
        findUnique: jest.Mock;
        update: jest.Mock;
      };
    };

  const yearId = 'y1';
  const dto = {
    accountingYearId: yearId,
    name: 'T1 2025',
    monthStartDate: '2025-01-01T00:00:00.000Z',
    endDate: '2025-03-31T00:00:00.000Z',
    isActive: true,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountingQuartersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<AccountingQuartersService>(AccountingQuartersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create: année inexistante', async () => {
    p().accountingYear.findFirst.mockResolvedValue(null);
    await expect(service.create(dto)).rejects.toThrow(BadRequestException);
  });

  it('create: dates invalides', async () => {
    p().accountingYear.findFirst.mockResolvedValue({ id: yearId });
    await expect(
      service.create({
        ...dto,
        monthStartDate: '2025-12-31T00:00:00.000Z',
        endDate: '2025-01-01T00:00:00.000Z',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('create: OK', async () => {
    p().accountingYear.findFirst.mockResolvedValue({ id: yearId });
    const row = { id: 'q1', ...dto };
    p().accountingQuarter.create.mockResolvedValue(row);
    await expect(service.create(dto)).resolves.toEqual(row);
  });

  it('findOne: NotFound', async () => {
    p().accountingQuarter.findFirst.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
  });

  it('update: dates invalides après merge', async () => {
    p().accountingQuarter.findFirst.mockResolvedValue({
      id: 'q1',
      monthStartDate: new Date('2025-06-01'),
      endDate: new Date('2025-06-30'),
    });
    p().accountingQuarter.findUnique.mockResolvedValue({
      id: 'q1',
      monthStartDate: new Date('2025-06-01'),
      endDate: new Date('2025-06-30'),
    });
    await expect(
      service.update('q1', {
        monthStartDate: '2025-07-01T00:00:00.000Z',
        endDate: '2025-06-01T00:00:00.000Z',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('remove: soft delete', async () => {
    p().accountingQuarter.findFirst.mockResolvedValue({ id: 'q1' });
    p().accountingQuarter.update.mockResolvedValue({
      id: 'q1',
      deletedAt: new Date(),
    });
    await service.remove('q1');
    expect(p().accountingQuarter.update).toHaveBeenCalled();
  });
});
