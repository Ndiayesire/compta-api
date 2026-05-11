import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../common/testing/prisma-mock';
import { ClientsService } from './clients.service';

describe('ClientsService (CRUD mocké)', () => {
  let service: ClientsService;
  let prisma: PrismaService;

  const companyId = 'co1';
  const actingUserId = 'user1';

  const p = () =>
    prisma as unknown as {
      user: { findUnique: jest.Mock };
      client: {
        create: jest.Mock;
        findMany: jest.Mock;
        findFirst: jest.Mock;
        update: jest.Mock;
      };
    };

  const clientFields = {
    name: 'Client SA',
    address: 'Dakar',
    postalCode: '12500',
    ninea: 'N123',
    countryId: 'c1',
    regionId: 'r1',
    legalFormId: 'lf1',
    useTva: true,
    meta: {},
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<ClientsService>(ClientsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create sans user imbriqué: lie actingUserId', async () => {
    const created = { id: 'cl1', ...clientFields, userId: actingUserId };
    p().client.create.mockResolvedValue(created);

    const result = await service.create(
      clientFields as Parameters<ClientsService['create']>[0],
      companyId,
      actingUserId,
    );

    expect(result).toEqual(created);
    expect(p().client.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: actingUserId,
          companyId,
          name: clientFields.name,
        }),
      }),
    );
  });

  it('create avec user: email déjà pris', async () => {
    p().user.findUnique.mockResolvedValue({ id: 'u99' });
    await expect(
      service.create(
        {
          ...clientFields,
          user: {
            email: 'dup@x.sn',
            password: 'secret12345',
            countryId: 'c1',
            regionId: 'r1',
            languageId: 'l1',
            genderId: 'g1',
            roleId: 'role1',
          },
        } as Parameters<ClientsService['create']>[0],
        companyId,
        actingUserId,
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('findOne: NotFound', async () => {
    p().client.findFirst.mockResolvedValue(null);
    await expect(service.findOne('x', companyId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('findAll', async () => {
    p().client.findMany.mockResolvedValue([]);
    await service.findAll(companyId);
    expect(p().client.findMany).toHaveBeenCalledWith({
      where: { companyId, deletedAt: null },
      include: expect.any(Object),
      orderBy: { createdAt: 'desc' },
    });
  });
});
