import * as fs from 'fs';
import * as path from 'path';
import ExcelJS from 'exceljs';
import {
  assertExemptionImportHeadersComplete,
  buildExemptionImportColumnMap,
  findOrCreateTierIdByClientName,
  parseDeclarationMonth,
} from './op-exemption-excel-import';

const TEMPLATE_PATH = path.join(
  __dirname,
  '..',
  '..',
  'assets',
  'xlsx',
  'exemptions-import-template.xlsx',
);

describe('op-exemption-excel-import', () => {
  it('reconnaît les en-têtes du modèle exemptions-import-template.xlsx', async () => {
    expect(fs.existsSync(TEMPLATE_PATH)).toBe(true);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(TEMPLATE_PATH);
    const sheet = wb.worksheets[0];
    const colMap = buildExemptionImportColumnMap(sheet.getRow(1));
    expect(() => assertExemptionImportHeadersComplete(colMap)).not.toThrow();
    expect(colMap.get('moisDeclaration')).toBe(1);
    expect(colMap.get('numeroFacture')).toBe(2);
    expect(colMap.get('montantHt')).toBe(3);
    expect(colMap.get('client')).toBe(4);
    expect(colMap.get('motif')).toBe(5);
  });

  it('parseDeclarationMonth accepte un entier 1–12', async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet('test');
    sheet.getCell(2, 1).value = 3;
    expect(parseDeclarationMonth(sheet, 2, 1)).toBe(3);
  });

  it('parseDeclarationMonth rejette une date ou une valeur hors plage', async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet('test');
    sheet.getCell(2, 1).value = '01/2025';
    expect(() => parseDeclarationMonth(sheet, 2, 1)).toThrow(/entier entre 1 et 12/);
    sheet.getCell(2, 1).value = 13;
    expect(() => parseDeclarationMonth(sheet, 2, 1)).toThrow(/entier entre 1 et 12/);
  });

  it('findOrCreateTierIdByClientName crée un tiers si le nom est inconnu (case insensitive)', async () => {
    const cache = new Map<string, string>();
    const clientId = 'client-1';
    const createdRows: unknown[] = [];
    const prisma = {
      tier: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockImplementation(({ data }) => {
          createdRows.push(data);
          return Promise.resolve({ id: 'new-tier-id' });
        }),
      },
      tierType: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'type-client', name: 'Client', code: 'CLIENT', isActive: true },
        ]),
      },
    };

    const first = await findOrCreateTierIdByClientName(
      prisma as never,
      clientId,
      '  Acme SARL  ',
      cache,
    );
    expect(first).toEqual({ tierId: 'new-tier-id', created: true });
    expect(createdRows[0]).toMatchObject({
      clientId,
      name: 'Acme SARL',
      tierTypeId: 'type-client',
    });

    const second = await findOrCreateTierIdByClientName(
      prisma as never,
      clientId,
      'acme sarl',
      cache,
    );
    expect(second).toEqual({ tierId: 'new-tier-id', created: false });
    expect(prisma.tier.create).toHaveBeenCalledTimes(1);
  });

  it('findOrCreateTierIdByClientName réutilise un tiers existant par nom', async () => {
    const prisma = {
      tier: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'existing-id', name: 'Tier démo fournisseur A' },
        ]),
        create: jest.fn(),
      },
      tierType: { findMany: jest.fn() },
    };
    const result = await findOrCreateTierIdByClientName(
      prisma as never,
      'client-1',
      'tier démo fournisseur a',
      new Map(),
    );
    expect(result).toEqual({ tierId: 'existing-id', created: false });
    expect(prisma.tier.create).not.toHaveBeenCalled();
  });
});
