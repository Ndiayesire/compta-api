import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { createPrismaMock } from '../../../common/testing/prisma-mock';
import { RegionsService } from './regions.service';
import type { CreateRegionDto } from './dto/create-region.dto';

type RegionRow = {
  id: string;
  countryId: string;
  name: string;
  code: string;
  isActive: boolean;
};

describe('RegionsService (CRUD mocké)', () => {
  let service: RegionsService;
  let prisma: PrismaService;

  const createDto: CreateRegionDto = {
    name: 'Dakar',
    countryId: 'a0000001-0000-4000-8000-000000000001',
    code: 'DK',
  };

  const regionRow = (overrides: Partial<RegionRow> = {}): RegionRow => ({
    id: 'a0000002-0000-4000-8000-000000000001',
    countryId: createDto.countryId,
    name: createDto.name,
    code: createDto.code,
    isActive: true,
    ...overrides,
  });

  const regionDelegate = () =>
    prisma as unknown as {
      region: {
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
        RegionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<RegionsService>(RegionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('persiste une région avec le DTO', async () => {
      const created = regionRow();
      regionDelegate().region.create.mockResolvedValue(created);

      const result = await service.create(createDto);

      expect(result).toEqual(created);
      expect(regionDelegate().region.create).toHaveBeenCalledWith({
        data: createDto,
      });
    });
  });

  describe('findAll', () => {
    it('retourne les régions triées par nom', async () => {
      const list = [regionRow({ name: 'Abidjan' }), regionRow({ name: 'Dakar' })];
      regionDelegate().region.findMany.mockResolvedValue(list);

      const result = await service.findAll();

      expect(result).toEqual(list);
      expect(regionDelegate().region.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('retourne la région si elle existe', async () => {
      const row = regionRow();
      regionDelegate().region.findUnique.mockResolvedValue(row);

      const result = await service.findOne(row.id);

      expect(result).toEqual(row);
      expect(regionDelegate().region.findUnique).toHaveBeenCalledWith({
        where: { id: row.id },
      });
    });

    it('lève NotFoundException si la région est absente', async () => {
      regionDelegate().region.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('00000000-0000-0000-0000-000000000099'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('met à jour après vérification findOne', async () => {
      const row = regionRow();
      const updated = { ...row, name: 'Dakar-Plateau' };
      regionDelegate().region.findUnique.mockResolvedValue(row);
      regionDelegate().region.update.mockResolvedValue(updated);

      const result = await service.update(row.id, { name: 'Dakar-Plateau' });

      expect(result).toEqual(updated);
      expect(regionDelegate().region.update).toHaveBeenCalledWith({
        where: { id: row.id },
        data: { name: 'Dakar-Plateau' },
      });
    });

    it('propage NotFound si findOne échoue', async () => {
      regionDelegate().region.findUnique.mockResolvedValue(null);

      await expect(
        service.update('missing-id', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
      expect(regionDelegate().region.update).not.toHaveBeenCalled();
    });
  });

  describe('remove (soft)', () => {
    it('désactive la région (isActive: false)', async () => {
      const row = regionRow();
      const deactivated = { ...row, isActive: false };
      regionDelegate().region.findUnique.mockResolvedValue(row);
      regionDelegate().region.update.mockResolvedValue(deactivated);

      const result = await service.remove(row.id);

      expect(result).toEqual(deactivated);
      expect(regionDelegate().region.update).toHaveBeenCalledWith({
        where: { id: row.id },
        data: { isActive: false },
      });
    });

    it('lève NotFound si la région est introuvable', async () => {
      regionDelegate().region.findUnique.mockResolvedValue(null);

      await expect(service.remove('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
