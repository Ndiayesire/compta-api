import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { createPrismaMock } from '../../../common/testing/prisma-mock';
import { ContractTypesService } from './contract-types.service';

describe('ContractTypesService (CRUD mocké)', () => {
  let service: ContractTypesService;
  let prisma: PrismaService;

  const p = () =>
    prisma as unknown as {
      contractType: {
        findFirst: jest.Mock;
        create: jest.Mock;
        findMany: jest.Mock;
        findUnique: jest.Mock;
        update: jest.Mock;
      };
    };

  const dto = {
    name: 'CDI',
    code: 'CDI',
    isActive: true,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractTypesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<ContractTypesService>(ContractTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create: doublon', async () => {
    p().contractType.findFirst.mockResolvedValue({ id: '1' });
    await expect(service.create(dto)).rejects.toThrow(BadRequestException);
  });

  it('findOne: NotFound', async () => {
    p().contractType.findUnique.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
  });

  it('findAll', async () => {
    p().contractType.findMany.mockResolvedValue([]);
    await service.findAll();
    expect(p().contractType.findMany).toHaveBeenCalled();
  });
});
