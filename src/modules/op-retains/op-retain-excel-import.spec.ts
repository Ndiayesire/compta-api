import * as fs from 'fs';
import * as path from 'path';
import ExcelJS from 'exceljs';
import { assertRetainImportHeadersComplete, buildRetainImportColumnMap, parseOpRetainImportWorkbook } from './op-retain-excel-import';

const TEMPLATE_PATH = path.join(
  __dirname,
  '..',
  '..',
  'assets',
  'xlsx',
  'retains-import-template.xlsx',
);

async function buildTestBuffer(rows: unknown[][]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Retains');
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

describe('op-retain-excel-import', () => {
  it('reconnaît les en-têtes du modèle retains-import-template.xlsx', async () => {
    expect(fs.existsSync(TEMPLATE_PATH)).toBe(true);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(TEMPLATE_PATH);
    const sheet = wb.worksheets[0];
    const colMap = buildRetainImportColumnMap(sheet.getRow(1));
    expect(() => assertRetainImportHeadersComplete(colMap)).not.toThrow();
    expect(colMap.get('raisonSociale')).toBeDefined();
    expect(colMap.get('numeroFacture')).toBeDefined();
    expect(colMap.get('base')).toBeDefined();
    expect(colMap.get('taux')).toBeDefined();
    expect(colMap.get('montant')).toBeDefined();
  });

  it('parseOpRetainImportWorkbook réutilise un fournisseur existant par raison sociale', async () => {
    const prisma = mockSupplierTierPrisma([{ id: 'tier-existing', name: 'Fournisseur Demo' }]);
    const buffer = await buildTestBuffer([
      ['RAISON SOCIALE DU FOURNISSEUR', 'ADRESSE', 'N°FACTURE', 'DATE', 'BASE', 'TAUX', 'MONTANT'],
      ['fournisseur demo', 'Dakar', 'RET-001', new Date('2025-01-25'), 50000, '5%', 2500],
    ]);

    const results = await parseOpRetainImportWorkbook(prisma as never, 'client-1', buffer);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      rowNumber: 2,
      tierCreated: false,
      dto: {
        tierId: 'tier-existing',
        code: 'RET-001',
        month: 1,
        year: 2025,
        base: 50000,
        rate: 5,
        amount: 2500,
      },
    });
    expect(prisma.tier.create).not.toHaveBeenCalled();
  });

  it('parseOpRetainImportWorkbook crée un fournisseur SUPPLIER si absent', async () => {
    const prisma = mockSupplierTierPrisma();
    const buffer = await buildTestBuffer([
      ['RAISON SOCIALE DU FOURNISSEUR', 'ADRESSE', 'N°FACTURE', 'DATE', 'BASE', 'TAUX', 'MONTANT'],
      ['Nouveau Fournisseur', 'Point E', 'RET-002', new Date('2025-02-10'), 10000, 10, 1000],
    ]);

    const results = await parseOpRetainImportWorkbook(prisma as never, 'client-1', buffer);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      rowNumber: 2,
      tierCreated: true,
      dto: expect.objectContaining({ tierId: 'tier-new', code: 'RET-002' }),
    });
    expect(prisma.tier.create).toHaveBeenCalled();
  });
});
