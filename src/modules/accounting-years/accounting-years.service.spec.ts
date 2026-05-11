import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../common/testing/prisma-mock';
import { AccountingYearsService } from './accounting-years.service';

describe('AccountingYearsService (CRUD mocké)', () => {
  let service: AccountingYearsService;
  let prisma: PrismaService;

  const p = () =>
    prisma as unknown as {
      accountingYear: {
        create: jest.Mock;
        findMany: jest.Mock;
        findFirst: jest.Mock;
        findUnique: jest.Mock;
        update: jest.Mock;
      };
      accountingQuarter: { count: jest.Mock };
    };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountingYearsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<AccountingYearsService>(AccountingYearsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create: start >= end', async () => {
    await expect(
      service.create({
        name: '2025',
        startDate: '2025-12-31T00:00:00.000Z',
        endDate: '2025-01-01T00:00:00.000Z',
        isActive: true,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('create: OK', async () => {
    const row = { id: 'y1', name: '2025' };
    p().accountingYear.create.mockResolvedValue(row);
    await expect(
      service.create({
        name: '2025',
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-12-31T00:00:00.000Z',
        isActive: true,
      }),
    ).resolves.toEqual(row);
  });

  it('findOne: NotFound', async () => {
    p().accountingYear.findFirst.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
  });

  it('update: dates invalides', async () => {
    p().accountingYear.findFirst.mockResolvedValue({ id: 'y1' });
    p().accountingYear.findUnique.mockResolvedValue({
      id: 'y1',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
    });
    await expect(
      service.update('y1', {
        startDate: '2025-12-31T00:00:00.000Z',
        endDate: '2025-01-01T00:00:00.000Z',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('remove: refuse si trimestres', async () => {
    p().accountingYear.findFirst.mockResolvedValue({ id: 'y1' });
    p().accountingQuarter.count.mockResolvedValue(2);
    await expect(service.remove('y1')).rejects.toThrow(BadRequestException);
  });

  it('remove: OK', async () => {
    p().accountingYear.findFirst.mockResolvedValue({ id: 'y1' });
    p().accountingQuarter.count.mockResolvedValue(0);
    p().accountingYear.update.mockResolvedValue({
      id: 'y1',
      deletedAt: new Date(),
    });
    await service.remove('y1');
    expect(p().accountingYear.update).toHaveBeenCalled();
  });
});
