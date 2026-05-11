import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { createPrismaMock } from '../../../common/testing/prisma-mock';
import { LanguagesService } from './languages.service';

describe('LanguagesService (CRUD mocké)', () => {
  let service: LanguagesService;
  let prisma: PrismaService;

  const p = () =>
    prisma as unknown as {
      language: {
        findFirst: jest.Mock;
        findUnique: jest.Mock;
        create: jest.Mock;
        findMany: jest.Mock;
        update: jest.Mock;
      };
      user: { count: jest.Mock };
    };

  const dto = {
    countryId: 'c1',
    name: 'Français',
    code: 'fr',
    isActive: true,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LanguagesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<LanguagesService>(LanguagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create: doublon', async () => {
    p().language.findFirst.mockResolvedValue({});
    await expect(service.create(dto)).rejects.toThrow(BadRequestException);
  });

  it('create: OK avec include', async () => {
    p().language.findFirst.mockResolvedValue(null);
    const row = { id: 'l1', ...dto, country: {} };
    p().language.create.mockResolvedValue(row);
    await expect(service.create(dto)).resolves.toEqual(row);
  });

  it('findOne: NotFound', async () => {
    p().language.findUnique.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
  });

  it('update: connect country', async () => {
    p().language.findUnique.mockResolvedValue({ id: 'l1' });
    p().language.findFirst.mockResolvedValue(null);
    p().language.update.mockResolvedValue({ id: 'l1' });
    await service.update('l1', { countryId: 'c2' });
    expect(p().language.update).toHaveBeenCalled();
  });

  it('remove: refuse si users', async () => {
    p().language.findUnique.mockResolvedValue({ id: 'l1' });
    p().user.count.mockResolvedValue(2);
    await expect(service.remove('l1')).rejects.toThrow(BadRequestException);
  });
});
