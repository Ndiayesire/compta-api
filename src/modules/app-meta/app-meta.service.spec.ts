import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../common/testing/prisma-mock';
import { AppMetaService } from './app-meta.service';

describe('AppMetaService (CRUD mocké)', () => {
  let service: AppMetaService;
  let prisma: PrismaService;

  const p = () =>
    prisma as unknown as {
      appMeta: {
        findFirst: jest.Mock;
        create: jest.Mock;
        findMany: jest.Mock;
        update: jest.Mock;
      };
    };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppMetaService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<AppMetaService>(AppMetaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create: clé déjà prise', async () => {
    p().appMeta.findFirst.mockResolvedValue({ id: 1 });
    await expect(
      service.create({ key: 'k', value: 'v' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('findByKey: NotFound', async () => {
    p().appMeta.findFirst.mockResolvedValue(null);
    await expect(service.findByKey('missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('update: clé dupliquée', async () => {
    p().appMeta.findFirst
      .mockResolvedValueOnce({ id: 1 })
      .mockResolvedValueOnce({ id: 2 });
    await expect(
      service.update(1, { key: 'other' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('remove: soft', async () => {
    p().appMeta.findFirst.mockResolvedValue({ id: 1 });
    p().appMeta.update.mockResolvedValue({ id: 1, deletedAt: new Date() });
    await service.remove(1);
    expect(p().appMeta.update).toHaveBeenCalled();
  });
});
