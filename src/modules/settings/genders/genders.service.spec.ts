import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { createPrismaMock } from '../../../common/testing/prisma-mock';
import { GendersService } from './genders.service';

describe('GendersService (CRUD mocké)', () => {
  let service: GendersService;
  let prisma: PrismaService;

  const d = () =>
    prisma as unknown as {
      gender: {
        findFirst: jest.Mock;
        findUnique: jest.Mock;
        create: jest.Mock;
        findMany: jest.Mock;
        update: jest.Mock;
      };
      user: { count: jest.Mock };
    };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GendersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<GendersService>(GendersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create: refuse doublon name/code', async () => {
    d().gender.findFirst.mockResolvedValue({ id: 'x' });
    await expect(
      service.create({ name: 'M', code: 'M', isActive: true }),
    ).rejects.toThrow(BadRequestException);
  });

  it('create: OK', async () => {
    d().gender.findFirst.mockResolvedValue(null);
    const row = { id: 'g1', name: 'M', code: 'M' };
    d().gender.create.mockResolvedValue(row);
    await expect(
      service.create({ name: 'M', code: 'M', isActive: true }),
    ).resolves.toEqual(row);
  });

  it('findAll', async () => {
    const list = [{ id: 'g1' }];
    d().gender.findMany.mockResolvedValue(list);
    await expect(service.findAll()).resolves.toEqual(list);
  });

  it('findOne: NotFound', async () => {
    d().gender.findUnique.mockResolvedValue(null);
    await expect(service.findOne('id')).rejects.toThrow(NotFoundException);
  });

  it('update: refuse doublon', async () => {
    d().gender.findUnique.mockResolvedValue({ id: 'g1' });
    d().gender.findFirst.mockResolvedValue({ id: 'other' });
    await expect(
      service.update('g1', { code: 'X' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('remove: refuse si utilisateurs liés', async () => {
    d().gender.findUnique.mockResolvedValue({ id: 'g1' });
    d().user.count.mockResolvedValue(1);
    await expect(service.remove('g1')).rejects.toThrow(BadRequestException);
  });

  it('remove: soft delete', async () => {
    d().gender.findUnique.mockResolvedValue({ id: 'g1' });
    d().user.count.mockResolvedValue(0);
    d().gender.update.mockResolvedValue({ id: 'g1', isActive: false });
    await expect(service.remove('g1')).resolves.toMatchObject({
      isActive: false,
    });
  });
});
