import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { createPrismaMock } from '../../../common/testing/prisma-mock';
import { TierTypesService } from './tier-types.service';

describe('TierTypesService (CRUD mocké)', () => {
  let service: TierTypesService;
  let prisma: PrismaService;

  const p = () =>
    prisma as unknown as {
      tierType: {
        findFirst: jest.Mock;
        findUnique: jest.Mock;
        create: jest.Mock;
        findMany: jest.Mock;
        update: jest.Mock;
      };
      tier: { count: jest.Mock };
    };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TierTypesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<TierTypesService>(TierTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create: doublon', async () => {
    p().tierType.findFirst.mockResolvedValue({});
    await expect(
      service.create({ name: 'T', code: 'T', isActive: true }),
    ).rejects.toThrow(BadRequestException);
  });

  it('findOne: NotFound', async () => {
    p().tierType.findUnique.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
  });

  it('remove: refuse si tiers actifs', async () => {
    p().tierType.findUnique.mockResolvedValue({ id: 't1' });
    p().tier.count.mockResolvedValue(3);
    await expect(service.remove('t1')).rejects.toThrow(BadRequestException);
  });

  it('remove: OK', async () => {
    p().tierType.findUnique.mockResolvedValue({ id: 't1' });
    p().tier.count.mockResolvedValue(0);
    p().tierType.update.mockResolvedValue({ id: 't1', isActive: false });
    await expect(service.remove('t1')).resolves.toMatchObject({
      isActive: false,
    });
  });
});
