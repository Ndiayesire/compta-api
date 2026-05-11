import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../common/testing/prisma-mock';
import { EmployeesService } from './employees.service';

describe('EmployeesService (CRUD mocké)', () => {
  let service: EmployeesService;
  let prisma: PrismaService;

  const p = () =>
    prisma as unknown as {
      client: { findUnique: jest.Mock };
      contractType: { findFirst: jest.Mock };
      identificationType: { findFirst: jest.Mock };
      employee: {
        findFirst: jest.Mock;
        create: jest.Mock;
        findUniqueOrThrow: jest.Mock;
        update: jest.Mock;
      };
      employeeContractType: {
        create: jest.Mock;
        findFirst: jest.Mock;
        update: jest.Mock;
      };
    };

  const baseDto = {
    clientId: 'cl1',
    contractTypeId: 'ct1',
    firstName: 'A',
    lastName: 'B',
    jobTitle: 'Dev',
    email: 'a@b.sn',
    phone: '+221771234567',
    address: 'Dakar',
    startDate: '2025-01-01T00:00:00.000Z',
    endDate: '2025-12-31T00:00:00.000Z',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<EmployeesService>(EmployeesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create: client invalide', async () => {
    p().client.findUnique.mockResolvedValue(null);
    await expect(service.create(baseDto)).rejects.toThrow(BadRequestException);
  });

  it('create: contractType invalide', async () => {
    p().client.findUnique.mockResolvedValue({
      id: 'cl1',
      deletedAt: null,
    });
    p().contractType.findFirst.mockResolvedValue(null);
    await expect(service.create(baseDto)).rejects.toThrow(BadRequestException);
  });

  it('create: transaction OK', async () => {
    p().client.findUnique.mockResolvedValue({
      id: 'cl1',
      deletedAt: null,
    });
    p().contractType.findFirst.mockResolvedValue({
      id: 'ct1',
      deletedAt: null,
    });
    p().employee.create.mockResolvedValue({ id: 'emp1' });
    p().employeeContractType.create.mockResolvedValue({});
    const full = {
      id: 'emp1',
      clientId: 'cl1',
      employeeContractTypes: [],
    };
    p().employee.findUniqueOrThrow.mockResolvedValue(full);

    await expect(service.create(baseDto)).resolves.toEqual(full);
    expect(p().employee.create).toHaveBeenCalled();
    expect(p().employeeContractType.create).toHaveBeenCalled();
  });

  it('findOne: NotFound', async () => {
    p().employee.findFirst.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
  });
});
