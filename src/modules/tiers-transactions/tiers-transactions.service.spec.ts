import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../common/testing/prisma-mock';
import { TiersTransactionsService } from './tiers-transactions.service';

describe('TiersTransactionsService (CRUD mocké)', () => {
  let service: TiersTransactionsService;
  let prisma: PrismaService;

  const companyId = 'co1';

  const p = () =>
    prisma as unknown as {
      tier: { findFirst: jest.Mock };
      tiersTransaction: {
        create: jest.Mock;
        findMany: jest.Mock;
        findFirst: jest.Mock;
        update: jest.Mock;
      };
    };

  const createDto = {
    tierId: 'tier1',
    transactionId: 'tx1',
    net: 100,
    tax: 10,
    total: 110,
    date: '2025-01-15T00:00:00.000Z',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TiersTransactionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<TiersTransactionsService>(TiersTransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create: tier hors société', async () => {
    p().tier.findFirst.mockResolvedValue(null);
    await expect(
      service.create(createDto, companyId),
    ).rejects.toThrow(BadRequestException);
  });

  it('create: OK', async () => {
    p().tier.findFirst.mockResolvedValue({ id: 'tier1' });
    const row = { id: 'tt1', ...createDto };
    p().tiersTransaction.create.mockResolvedValue(row);
    await expect(service.create(createDto, companyId)).resolves.toEqual(row);
  });

  it('findOne: NotFound', async () => {
    p().tiersTransaction.findFirst.mockResolvedValue(null);
    await expect(service.findOne('x', companyId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('findAll: filtre tierId optionnel', async () => {
    p().tiersTransaction.findMany.mockResolvedValue([]);
    await service.findAll(companyId, 'tier1');
    expect(p().tiersTransaction.findMany).toHaveBeenCalled();
  });
});
