import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../common/testing/prisma-mock';
import { TiersService } from './tiers.service';
import { EtatTrimestrielSommesVerseesExcelService } from '../excel-reports/services/etat-trimestriel-sommes-versees-excel.service';
import { EtatAnnuelSommesVerseesExcelService } from '../excel-reports/services/etat-annuel-sommes-versees-excel.service';

describe('TiersService', () => {
  let service: TiersService;
  let prisma: PrismaService;
  const trimExcel = { fillWorkbook: jest.fn() };
  const annualExcel = { fillWorkbook: jest.fn() };

  const createDto = {
    tierTypeId: 'type-1',
    clientId: 'client-1',
    name: 'Fournisseur',
    ninea: '123',
    reference: 'REF-1',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TiersService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: EtatTrimestrielSommesVerseesExcelService,
          useValue: trimExcel,
        },
        {
          provide: EtatAnnuelSommesVerseesExcelService,
          useValue: annualExcel,
        },
      ],
    }).compile();

    service = module.get<TiersService>(TiersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create: rejette si le client est absent ou hors société', async () => {
    (prisma as unknown as { client: { findFirst: jest.Mock } }).client.findFirst.mockResolvedValue(
      null,
    );

    await expect(
      service.create(createDto, 'company-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('create: rejette si le type de tiers est invalide', async () => {
    (prisma as unknown as { client: { findFirst: jest.Mock } }).client.findFirst.mockResolvedValue({
      id: 'client-1',
    });
    (prisma as unknown as { tierType: { findUnique: jest.Mock } }).tierType.findUnique.mockResolvedValue(
      null,
    );

    await expect(
      service.create(createDto, 'company-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('create: persiste le tiers quand client et type sont valides', async () => {
    (prisma as unknown as { client: { findFirst: jest.Mock } }).client.findFirst.mockResolvedValue({
      id: 'client-1',
    });
    (prisma as unknown as { tierType: { findUnique: jest.Mock } }).tierType.findUnique.mockResolvedValue({
      id: 'type-1',
    });
    const created = { id: 'tier-1', name: createDto.name };
    (prisma as unknown as { tier: { create: jest.Mock } }).tier.create.mockResolvedValue(
      created,
    );

    const result = await service.create(createDto, 'company-1');

    expect(result).toEqual(created);
    expect(
      (prisma as unknown as { tier: { create: jest.Mock } }).tier.create,
    ).toHaveBeenCalled();
  });

  it('findOne: NotFoundException si le tiers est introuvable', async () => {
    (prisma as unknown as { tier: { findFirst: jest.Mock } }).tier.findFirst.mockResolvedValue(
      null,
    );

    await expect(service.findOne('missing', 'company-1')).rejects.toThrow(
      NotFoundException,
    );
  });
});
