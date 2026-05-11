import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { createPrismaMock } from '../../../common/testing/prisma-mock';
import { CurrencyService } from './currency.service';

describe('CurrencyService (CRUD mocké)', () => {
  let service: CurrencyService;
  let prisma: PrismaService;

  const p = () =>
    prisma as unknown as {
      currency: {
        create: jest.Mock;
        findMany: jest.Mock;
        findUnique: jest.Mock;
        findFirst: jest.Mock;
        update: jest.Mock;
      };
    };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrencyService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<CurrencyService>(CurrencyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create: P2002 → ConflictException', async () => {
    const err = Object.assign(new Error('dup'), { code: 'P2002' });
    p().currency.create.mockRejectedValue(err);
    await expect(
      service.create({ code: 'xof', name: 'Franc CFA' }),
    ).rejects.toThrow(ConflictException);
  });

  it('findOne: NotFound', async () => {
    p().currency.findUnique.mockResolvedValue(null);
    await expect(service.findOne('id')).rejects.toThrow(NotFoundException);
  });

  it('findByCode: inactive', async () => {
    p().currency.findFirst.mockResolvedValue({ id: '1', isActive: false });
    await expect(service.findByCode('xof')).rejects.toThrow(NotFoundException);
  });

  it('findAll', async () => {
    p().currency.findMany.mockResolvedValue([]);
    await service.findAll();
    expect(p().currency.findMany).toHaveBeenCalled();
  });
});
