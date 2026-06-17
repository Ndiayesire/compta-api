import * as fs from 'fs';
import * as path from 'path';
import ExcelJS from 'exceljs';
import { assertExportationImportHeadersComplete, buildExportationImportColumnMap, findCountryIdByName, normalizeLabelForMatch, resolveTierForExportationImport } from './op-exportation-excel-import';

const TEMPLATE_PATH = path.join(
  __dirname,
  '..',
  '..',
  'assets',
  'xlsx',
  'exportations-import-template.xlsx',
);

describe('op-exportation-excel-import', () => {
  it('reconnaît les en-têtes du modèle exportations-import-template.xlsx', async () => {
    expect(fs.existsSync(TEMPLATE_PATH)).toBe(true);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(TEMPLATE_PATH);
    const sheet = wb.worksheets[0];
    const colMap = buildExportationImportColumnMap(sheet.getRow(1));
    expect(() => assertExportationImportHeadersComplete(colMap)).not.toThrow();
    expect(colMap.get('annee')).toBeDefined();
    expect(colMap.get('mois')).toBeDefined();
    expect(colMap.get('client')).toBeDefined();
    expect(colMap.get('pays')).toBeDefined();
    expect(colMap.get('numeroFacture')).toBeDefined();
    expect(colMap.get('montant')).toBeDefined();
  });

  it('normalizeLabelForMatch ignore casse et accents', () => {
    expect(normalizeLabelForMatch('Sénégal')).toBe(normalizeLabelForMatch('senegal'));
  });

  it('findCountryIdByName résout un pays sans tenir compte des accents', async () => {
    const prisma = {
      country: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'country-sn', name: 'Sénégal', code: 'SN' },
        ]),
      },
    };
    const id = await findCountryIdByName(prisma as never, 'Senegal');
    expect(id).toBe('country-sn');
  });

  it('resolveTierForExportationImport met à jour un tiers trouvé par nom', async () => {
    const cache = new Map();
    const prisma = {
      tier: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'existing-id',
            name: 'Tier démo fournisseur A',
            ninea: 'OLD',
            meta: { seeded: true },
          },
        ]),
        update: jest.fn().mockResolvedValue({}),
        create: jest.fn(),
      },
      tierType: { findMany: jest.fn() },
    };

    const result = await resolveTierForExportationImport(
      prisma as never,
      'client-1',
      'tier démo fournisseur a',
      'SN999',
      'Nouvelle adresse',
      cache,
    );
    expect(result).toEqual({ tierId: 'existing-id', created: false, updated: true });
    expect(prisma.tier.update).toHaveBeenCalledWith({
      where: { id: 'existing-id' },
      data: {
        ninea: 'SN999',
        meta: expect.objectContaining({
          beneficiaryAddress: 'Nouvelle adresse',
          seeded: true,
        }),
      },
    });
    expect(prisma.tier.create).not.toHaveBeenCalled();
  });

  it('resolveTierForExportationImport réutilise un tiers existant par NINEA', async () => {
    const cache = new Map();
    const prisma = {
      tier: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'by-ninea', name: 'Autre nom', ninea: 'SN222333444', meta: {} },
        ]),
        update: jest.fn(),
        create: jest.fn(),
      },
      tierType: { findMany: jest.fn() },
    };

    const result = await resolveTierForExportationImport(
      prisma as never,
      'client-1',
      'Nom différent',
      'SN222333444',
      '',
      cache,
    );
    expect(result).toEqual({ tierId: 'by-ninea', created: false, updated: false });
    expect(prisma.tier.create).not.toHaveBeenCalled();
    expect(prisma.tier.update).not.toHaveBeenCalled();
  });

  it('resolveTierForExportationImport crée un tiers si aucune correspondance', async () => {
    const cache = new Map();
    const prisma = {
      tier: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'new-tier' }),
        update: jest.fn(),
      },
      tierType: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'type-client', name: 'Client', code: 'CLIENT', isActive: true },
        ]),
      },
    };

    const result = await resolveTierForExportationImport(
      prisma as never,
      'client-1',
      'Acme Export',
      'SN123',
      'Dakar Plateau',
      cache,
    );
    expect(result).toEqual({ tierId: 'new-tier', created: true, updated: false });
    expect(prisma.tier.create).toHaveBeenCalled();
  });
});
