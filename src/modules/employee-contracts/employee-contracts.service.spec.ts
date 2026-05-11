import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../common/testing/prisma-mock';
import { EmployeeContractsService } from './employee-contracts.service';

describe('EmployeeContractsService (CRUD mocké)', () => {
  let service: EmployeeContractsService;
  let prisma: PrismaService;

  const companyId = 'co1';

  const p = () =>
    prisma as unknown as {
      employee: { findFirst: jest.Mock };
      contractType: { findUnique: jest.Mock };
      employeeContractType: {
        create: jest.Mock;
        findMany: jest.Mock;
        findFirst: jest.Mock;
        update: jest.Mock;
      };
    };

  const createDto = {
    employeeId: 'e1',
    contractTypeId: 'ct1',
    startDate: '2025-01-01T00:00:00.000Z',
    endDate: '2025-12-31T00:00:00.000Z',
    jobTitle: 'Dev',
    isManager: false,
    isActive: true,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeContractsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<EmployeeContractsService>(EmployeeContractsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create: employé invalide', async () => {
    p().employee.findFirst.mockResolvedValue(null);
    await expect(
      service.create(createDto, companyId),
    ).rejects.toThrow(BadRequestException);
  });

  it('create: type de contrat invalide', async () => {
    p().employee.findFirst.mockResolvedValue({ id: 'e1', client: {} });
    p().contractType.findUnique.mockResolvedValue(null);
    await expect(
      service.create(createDto, companyId),
    ).rejects.toThrow(BadRequestException);
  });

  it('create: OK', async () => {
    p().employee.findFirst.mockResolvedValue({ id: 'e1', client: {} });
    p().contractType.findUnique.mockResolvedValue({ id: 'ct1' });
    const row = { id: 'ec1', ...createDto };
    p().employeeContractType.create.mockResolvedValue(row);
    await expect(service.create(createDto, companyId)).resolves.toEqual(row);
  });

  it('findOne: NotFound', async () => {
    p().employeeContractType.findFirst.mockResolvedValue(null);
    await expect(service.findOne('x', companyId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('findByEmployee: vérifie employé', async () => {
    p().employee.findFirst.mockResolvedValue(null);
    await expect(service.findByEmployee('e1', companyId)).rejects.toThrow(
      BadRequestException,
    );
  });
});
