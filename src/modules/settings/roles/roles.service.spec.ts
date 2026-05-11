import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { createPrismaMock } from '../../../common/testing/prisma-mock';
import { RolesService } from './roles.service';

describe('RolesService (CRUD mocké)', () => {
  let service: RolesService;
  let prisma: PrismaService;

  const p = () =>
    prisma as unknown as {
      role: {
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
        RolesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<RolesService>(RolesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create: nom déjà pris', async () => {
    p().role.findFirst.mockResolvedValue({ id: '1' });
    await expect(
      service.create({
        name: 'Admin',
        code: 'ADMIN',
        isActive: true,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('create: avec permissionIds', async () => {
    p().role.findFirst.mockResolvedValue(null);
    const row = { id: 'r1', name: 'Admin' };
    p().role.create.mockResolvedValue(row);
    await expect(
      service.create({
        name: 'Admin',
        code: 'ADMIN',
        permissionIds: ['p1', 'p2'],
        isActive: true,
      }),
    ).resolves.toEqual(row);
    expect(p().role.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          permissions: expect.any(Object),
        }),
      }),
    );
  });

  it('findOne: NotFound', async () => {
    p().role.findUnique.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
  });
});
