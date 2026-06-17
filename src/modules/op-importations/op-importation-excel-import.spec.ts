import * as fs from 'fs';
import * as path from 'path';
import ExcelJS from 'exceljs';
import {
  assertImportationImportHeadersComplete,
  buildImportationImportColumnMap,
  findOrCreateDeductionTypeByName,
  findOrCreatePropertyNatureTypeByName,
  inferDeductionTypeCode,
  resolveSupplierTierForImport,
} from './op-importation-excel-import';

const TEMPLATE_PATH = path.join(
  __dirname,
  '..',
  '..',
  'assets',
  'xlsx',
  'importations-import-template.xlsx',
);

describe('op-importation-excel-import', () => {
  it('reconnaît les en-têtes du modèle importations-import-template.xlsx', async () => {
    expect(fs.existsSync(TEMPLATE_PATH)).toBe(true);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(TEMPLATE_PATH);
    const sheet = wb.worksheets[0];
    const colMap = buildImportationImportColumnMap(sheet.getRow(1));
    expect(() => assertImportationImportHeadersComplete(colMap)).not.toThrow();
    expect(colMap.get('fournisseur')).toBeDefined();
    expect(colMap.get('typeDeduction')).toBeDefined();
    expect(colMap.get('natureBienService')).toBeDefined();
    expect(colMap.get('tvaDeductible')).toBeDefined();
  });

  it('inferDeductionTypeCode abrège le nom du type de déduction', () => {
    expect(inferDeductionTypeCode('Déduction standard')).toBe('DEDU-STAN');
    expect(inferDeductionTypeCode('Unique')).toBe('UNIQUE');
  });

  it('resolveSupplierTierForImport réutilise un fournisseur existant', async () => {
    const cache = new Map();
    const prisma = {
      tier: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'tier-existing', name: 'Tier démo fournisseur A' },
        ]),
        create: jest.fn(),
      },
      tierType: { findMany: jest.fn() },
    };

    const result = await resolveSupplierTierForImport(
      prisma as never,
      'client-1',
      'tier démo fournisseur a',
      'Point E',
      cache,
    );
    expect(result).toEqual({ tierId: 'tier-existing', created: false });
    expect(prisma.tier.create).not.toHaveBeenCalled();
  });

  it('resolveSupplierTierForImport crée un fournisseur SUPPLIER si absent', async () => {
    const cache = new Map();
    const prisma = {
      tier: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'new-tier' }),
      },
      tierType: {
        findMany: jest.fn().mockResolvedValue([{ id: 'type-supplier', code: 'SUPPLIER' }]),
      },
    };

    const result = await resolveSupplierTierForImport(
      prisma as never,
      'client-1',
      'Nouveau Fournisseur',
      'Adresse test',
      cache,
    );
    expect(result).toEqual({ tierId: 'new-tier', created: true });
    expect(prisma.tier.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tierTypeId: 'type-supplier',
          name: 'Nouveau Fournisseur',
        }),
      }),
    );
  });

  it('findOrCreateDeductionTypeByName crée un type avec code abrégé', async () => {
    const cache = new Map();
    const prisma = {
      deductionType: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'ded-new' }),
      },
    };

    const result = await findOrCreateDeductionTypeByName(
      prisma as never,
      'Déduction spéciale',
      cache,
    );
    expect(result).toEqual({ deductionTypeId: 'ded-new', created: true });
    expect(prisma.deductionType.create).toHaveBeenCalledWith({
      data: { name: 'Déduction spéciale', code: 'DEDU-SPEC', isActive: true },
      select: { id: true },
    });
  });

  it('findOrCreatePropertyNatureTypeByName incrémente le code', async () => {
    const cache = new Map();
    const prisma = {
      propertyNatureType: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'p1', name: 'MARCHANDISES', code: '1' },
          { id: 'p2', name: 'SERVICES', code: '3' },
        ]),
        create: jest.fn().mockResolvedValue({ id: 'p-new' }),
      },
    };

    const result = await findOrCreatePropertyNatureTypeByName(
      prisma as never,
      'Nouvelle nature',
      cache,
    );
    expect(result).toEqual({ propertyNatureTypeId: 'p-new', created: true });
    expect(prisma.propertyNatureType.create).toHaveBeenCalledWith({
      data: { name: 'Nouvelle nature', code: '4', isActive: true },
      select: { id: true },
    });
  });
});
