import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../common/testing/prisma-mock';
import { UsersService } from './users.service';

describe('UsersService (CRUD / auth mocké)', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const p = () =>
    prisma as unknown as {
      user: {
        findUnique: jest.Mock;
        findMany: jest.Mock;
        create: jest.Mock;
        update: jest.Mock;
      };
    };

  const baseUserDto = {
    email: 'new@x.sn',
    password: 'password12',
    firstName: 'A',
    lastName: 'B',
    phone: '+221',
    address: '',
    avatar: '',
    countryId: 'c1',
    regionId: 'r1',
    languageId: 'l1',
    genderId: 'g1',
    roleId: 'role1',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create: email déjà pris', async () => {
    p().user.findUnique.mockResolvedValue({ id: 'u1' });
    await expect(service.create(baseUserDto as never)).rejects.toThrow(
      ConflictException,
    );
  });

  it('create: roleId manquant', async () => {
    p().user.findUnique.mockResolvedValue(null);
    const { roleId: _r, ...noRole } = baseUserDto;
    await expect(
      service.create({ ...noRole, roleId: undefined } as never),
    ).rejects.toThrow(BadRequestException);
  });

  it('create: OK (avec companies pour withCompany)', async () => {
    p().user.findUnique.mockResolvedValue(null);
    const created = {
      id: 'u1',
      email: baseUserDto.email,
      companies: [{ id: 'co1' }],
      role: { permissions: [] },
    };
    p().user.create.mockResolvedValue(created);

    const result = await service.create(baseUserDto as never);

    expect(result).toMatchObject({
      id: 'u1',
      company: { id: 'co1' },
    });
  });

  it('findOne: NotFound', async () => {
    p().user.findUnique.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });
});
