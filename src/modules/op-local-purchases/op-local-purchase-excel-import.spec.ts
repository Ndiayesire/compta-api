import * as fs from 'fs';
import * as path from 'path';
import ExcelJS from 'exceljs';
import { assertLocalPurchaseImportHeadersComplete, buildLocalPurchaseImportColumnMap, resolveSupplierTierForPurchaseImport } from './op-local-purchase-excel-import';

const TEMPLATE_PATH = path.join(
  __dirname,
  '..',
  '..',
  'assets',
  'xlsx',
  'purchases-import-template.xlsx',
);

describe('op-local-purchase-excel-import', () => {
  it('reconnaît les en-têtes du modèle purchases-import-template.xlsx', async () => {
    expect(fs.existsSync(TEMPLATE_PATH)).toBe(true);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(TEMPLATE_PATH);
    const sheet = wb.worksheets[0];
    const colMap = buildLocalPurchaseImportColumnMap(sheet.getRow(1));
    expect(() => assertLocalPurchaseImportHeadersComplete(colMap)).not.toThrow();
    expect(colMap.get('ninea')).toBeDefined();
    expect(colMap.get('cofi')).toBeDefined();
    expect(colMap.get('fournisseur')).toBeDefined();
    expect(colMap.get('ttc')).toBeDefined();
    expect(colMap.get('txProrata')).toBeDefined();
  });

  it('resolveSupplierTierForPurchaseImport crée un fournisseur SUPPLIER avec COFI', async () => {
    const cache = new Map();
    const prisma = {
      tier: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'new-tier' }),
        update: jest.fn(),
      },
      tierType: {
        findMany: jest.fn().mockResolvedValue([{ id: 'type-supplier', code: 'SUPPLIER' }]),
      },
    };

    const result = await resolveSupplierTierForPurchaseImport(
      prisma as never,
      'client-1',
      'Nouveau Fournisseur',
      'SN888777666',
      'COFI-123',
      'Dakar',
      cache,
    );
    expect(result).toEqual({ tierId: 'new-tier', created: true, updated: false });
    expect(prisma.tier.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tierTypeId: 'type-supplier',
          ninea: 'SN888777666',
          meta: expect.objectContaining({ cofi: 'COFI-123' }),
        }),
      }),
    );
  });

  it('resolveSupplierTierForPurchaseImport réutilise un tiers par NINEA', async () => {
    const cache = new Map();
    const prisma = {
      tier: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'by-ninea', name: 'Existant', ninea: 'SN111', meta: {} },
        ]),
        update: jest.fn().mockResolvedValue({}),
        create: jest.fn(),
      },
      tierType: { findMany: jest.fn() },
    };

    const result = await resolveSupplierTierForPurchaseImport(
      prisma as never,
      'client-1',
      'Autre nom',
      'SN111',
      'COFI-99',
      'Adresse',
      cache,
    );
    expect(result).toEqual({ tierId: 'by-ninea', created: false, updated: true });
    expect(prisma.tier.create).not.toHaveBeenCalled();
  });
});
