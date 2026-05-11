import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { createPrismaMock } from '../../../common/testing/prisma-mock';
import { CountriesService } from './countries.service';

describe('CountriesService (CRUD mocké)', () => {
  let service: CountriesService;
  let prisma: PrismaService;

  const p = () =>
    prisma as unknown as {
      country: {
        create: jest.Mock;
        findMany: jest.Mock;
        findUnique: jest.Mock;
        update: jest.Mock;
      };
    };

  const createDto = {
    currencyId: 'cur1',
    name: 'Sénégal',
    code: 'SN',
    tva: 18,
    callingCode: '+221',
    isActive: true,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CountriesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<CountriesService>(CountriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create', async () => {
    const row = { id: 'sn1', ...createDto };
    p().country.create.mockResolvedValue(row);
    await expect(service.create(createDto as never)).resolves.toEqual(row);
    expect(p().country.create).toHaveBeenCalled();
  });

  it('findOne: NotFound', async () => {
    p().country.findUnique.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
  });

  it('update: après findOne', async () => {
    p().country.findUnique.mockResolvedValue({ id: 'sn1' });
    p().country.update.mockResolvedValue({ id: 'sn1', name: 'SN' });
    await service.update('sn1', { name: 'SN' });
    expect(p().country.update).toHaveBeenCalled();
  });

  it('remove: isActive false', async () => {
    p().country.findUnique.mockResolvedValue({ id: 'sn1' });
    p().country.update.mockResolvedValue({ id: 'sn1', isActive: false });
    await service.remove('sn1');
    expect(p().country.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { isActive: false },
      }),
    );
  });
});
