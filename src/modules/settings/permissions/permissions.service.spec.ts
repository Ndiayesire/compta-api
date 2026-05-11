import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { createPrismaMock } from '../../../common/testing/prisma-mock';
import { PermissionsService } from './permissions.service';

describe('PermissionsService (CRUD mocké)', () => {
  let service: PermissionsService;
  let prisma: PrismaService;

  const p = () =>
    prisma as unknown as {
      permission: {
        findFirst: jest.Mock;
        create: jest.Mock;
        findMany: jest.Mock;
        findUnique: jest.Mock;
        update: jest.Mock;
      };
    };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<PermissionsService>(PermissionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create: doublon nom', async () => {
    p().permission.findFirst.mockResolvedValue({ id: '1' });
    await expect(
      service.create({
        typeId: 't1',
        name: 'READ_CLIENTS',
        code: 'clients.read',
        isActive: true,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('findByTypeId', async () => {
    p().permission.findMany.mockResolvedValue([]);
    await service.findByTypeId('t1');
    expect(p().permission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { typeId: 't1' } }),
    );
  });

  it('findOne: NotFound', async () => {
    p().permission.findUnique.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
  });
});
