import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../common/testing/prisma-mock';
import { CompanyService } from './company.service';

describe('CompanyService (CRUD mocké)', () => {
  let service: CompanyService;
  let prisma: PrismaService;

  const p = () =>
    prisma as unknown as {
      user: { findUnique: jest.Mock; create: jest.Mock };
      company: {
        create: jest.Mock;
        findMany: jest.Mock;
        findUnique: jest.Mock;
        update: jest.Mock;
      };
    };

  const userDto = {
    email: 'owner@co.sn',
    password: 'password12',
    roleId: 'role1',
    countryId: 'c1',
    regionId: 'r1',
    languageId: 'l1',
    genderId: 'g1',
  };

  const companyDto = {
    name: 'Ma SA',
    email: 'contact@co.sn',
    phone: '+221330000000',
    address: 'Dakar',
    ninea: 'N123',
    reference: 'REF',
    legalFormId: 'lf1',
    countryId: 'c1',
    regionId: 'r1',
    user: userDto,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<CompanyService>(CompanyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findOne: NotFound', async () => {
    p().company.findUnique.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
  });

  it('create: email utilisateur déjà utilisé', async () => {
    p().user.findUnique.mockResolvedValue({ id: 'u1' });
    await expect(service.create(companyDto as never)).rejects.toThrow(
      ConflictException,
    );
  });

  it('create: transaction OK', async () => {
    p().user.findUnique.mockResolvedValue(null);
    p().user.create.mockResolvedValue({ id: 'new-user' });
    const companyRow = {
      id: 'comp1',
      userId: 'new-user',
      name: companyDto.name,
    };
    p().company.create.mockResolvedValue(companyRow);

    const result = await service.create(companyDto as never);

    expect(result).toEqual({ company: companyRow });
    expect(p().user.create).toHaveBeenCalled();
    expect(p().company.create).toHaveBeenCalled();
  });

  it('findAll', async () => {
    p().company.findMany.mockResolvedValue([]);
    await service.findAll();
    expect(p().company.findMany).toHaveBeenCalled();
  });
});
