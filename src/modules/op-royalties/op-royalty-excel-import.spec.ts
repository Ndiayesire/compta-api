import * as fs from 'fs';
import * as path from 'path';
import ExcelJS from 'exceljs';
import {
  assertRoyaltyImportHeadersComplete,
  buildRoyaltyImportColumnMap,
  parseOpRoyaltyImportWorkbook,
} from './op-royalty-excel-import';

const TEMPLATE_PATH = path.join(
  __dirname,
  '..',
  '..',
  'assets',
  'xlsx',
  'royalties-import-template.xlsx',
);

async function buildTestBuffer(rows: unknown[][]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Royalties');
  for (const row of rows) {
    ws.addRow(row);
  }
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

function mockSupplierTierPrisma(existing: { id: string; name: string }[] = []) {
  return {
    tier: {
      findMany: jest.fn().mockResolvedValue(existing),
      create: jest.fn().mockResolvedValue({ id: 'tier-new' }),
    },
    tierType: {
      findMany: jest.fn().mockResolvedValue([{ id: 'type-supplier', code: 'SUPPLIER' }]),
    },
  };
}

describe('op-royalty-excel-import', () => {
  it('reconnaît les en-têtes du modèle royalties-import-template.xlsx', async () => {
    expect(fs.existsSync(TEMPLATE_PATH)).toBe(true);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(TEMPLATE_PATH);
    const sheet = wb.worksheets[0];
    const colMap = buildRoyaltyImportColumnMap(sheet.getRow(1));
    expect(() => assertRoyaltyImportHeadersComplete(colMap)).not.toThrow();
    expect(colMap.get('raisonSociale')).toBeDefined();
    expect(colMap.get('numeroFacture')).toBeDefined();
    expect(colMap.get('base')).toBeDefined();
    expect(colMap.get('taux')).toBeDefined();
    expect(colMap.get('montant')).toBeDefined();
  });

  it('parseOpRoyaltyImportWorkbook réutilise un fournisseur existant par raison sociale', async () => {
    const prisma = mockSupplierTierPrisma([{ id: 'tier-existing', name: 'Fournisseur Demo' }]);
    const buffer = await buildTestBuffer([
      ['RAISON SOCIALE DU FOURNISSEUR', 'ADRESSE', 'N°FACTURE', 'DATE', 'BASE', 'TAUX', 'MONTANT'],
      ['Fournisseur Demo', 'Dakar', 'ROY-001', new Date('2025-01-28'), 80000, 10, 8000],
    ]);

    const results = await parseOpRoyaltyImportWorkbook(prisma as never, 'client-1', buffer);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      rowNumber: 2,
      tierCreated: false,
      dto: {
        tierId: 'tier-existing',
        code: 'ROY-001',
        month: 1,
        year: 2025,
        base: 80000,
        rate: 10,
        amount: 8000,
      },
    });
    expect(prisma.tier.create).not.toHaveBeenCalled();
  });

  it('parseOpRoyaltyImportWorkbook crée un fournisseur SUPPLIER si absent', async () => {
    const prisma = mockSupplierTierPrisma();
    const buffer = await buildTestBuffer([
      ['RAISON SOCIALE DU FOURNISSEUR', 'ADRESSE', 'N°FACTURE', 'DATE', 'BASE', 'TAUX', 'MONTANT'],
      ['Redevance Fournisseur', 'Adresse', 'ROY-002', new Date('2025-03-15'), 5000, '0.05', 250],
    ]);

    const results = await parseOpRoyaltyImportWorkbook(prisma as never, 'client-1', buffer);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      rowNumber: 2,
      tierCreated: true,
      dto: expect.objectContaining({
        tierId: 'tier-new',
        code: 'ROY-002',
        rate: 5,
        amount: 250,
      }),
    });
    expect(prisma.tier.create).toHaveBeenCalled();
  });
});
