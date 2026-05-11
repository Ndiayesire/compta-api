import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { createPrismaMock } from '../../../common/testing/prisma-mock';
import { IdentificationTypesService } from './identification-types.service';

describe('IdentificationTypesService (CRUD mocké)', () => {
  let service: IdentificationTypesService;
  let prisma: PrismaService;

  const p = () =>
    prisma as unknown as {
      identificationType: {
        findFirst: jest.Mock;
        create: jest.Mock;
        findMany: jest.Mock;
        update: jest.Mock;
        delete: jest.Mock;
      };
      employee: { count: jest.Mock };
    };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdentificationTypesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<IdentificationTypesService>(IdentificationTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create: doublon', async () => {
    p().identificationType.findFirst.mockResolvedValue({});
    await expect(
      service.create({ name: 'CNI', code: 'CNI', isActive: true }),
    ).rejects.toThrow(BadRequestException);
  });

  it('findOne: NotFound', async () => {
    p().identificationType.findFirst.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
  });

  it('remove: refuse si employés', async () => {
    p().identificationType.findFirst.mockResolvedValue({ id: 'i1' });
    p().employee.count.mockResolvedValue(1);
    await expect(service.remove('i1')).rejects.toThrow(BadRequestException);
  });

  it('remove: delete dur', async () => {
    p().identificationType.findFirst.mockResolvedValue({ id: 'i1' });
    p().employee.count.mockResolvedValue(0);
    p().identificationType.delete.mockResolvedValue({ id: 'i1' });
    await expect(service.remove('i1')).resolves.toEqual({ id: 'i1' });
    expect(p().identificationType.delete).toHaveBeenCalledWith({
      where: { id: 'i1' },
    });
  });
});
