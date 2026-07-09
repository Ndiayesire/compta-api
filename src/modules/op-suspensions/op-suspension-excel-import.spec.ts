import * as fs from 'fs';
import * as path from 'path';
import ExcelJS from 'exceljs';
import { assertSuspensionImportHeadersComplete, buildSuspensionImportColumnMap, parseOpSuspensionImportWorkbook } from './op-suspension-excel-import';

const TEMPLATE_PATH = path.join(
  __dirname,
  '..',
  '..',
  'assets',
  'xlsx',
  'suspensions-import-template.xlsx',
);

async function buildTestBuffer(rows: unknown[][]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Suspensions');
  for (const row of rows) {
    ws.addRow(row);
  }
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

function mockClientTierPrisma(
  existing: { id: string; name: string; ninea: string; meta?: unknown }[] = [],
) {
  return {
    tier: {
      findMany: jest.fn().mockResolvedValue(existing),
      create: jest.fn().mockResolvedValue({ id: 'tier-new' }),
      update: jest.fn().mockResolvedValue({}),
    },
    tierType: {
      findMany: jest.fn().mockResolvedValue([{ id: 'type-client', code: 'CLIENT', name: 'Client' }]),
    },
  };
}

const HEADERS = [
  'ANNEE',
  'MOIS',
  'NINEA',
  'DENOMINATION DU CLIENT',
  'ADRESSE',
  'N°FACTURE',
  'MONTANT',
  'TVA',
  'N°VISA ',
  'DATE VISA',
];

describe('op-suspension-excel-import', () => {
  it('reconnaît les en-têtes du modèle suspensions-import-template.xlsx', async () => {
    expect(fs.existsSync(TEMPLATE_PATH)).toBe(true);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(TEMPLATE_PATH);
    const sheet = wb.worksheets[0];
    const colMap = buildSuspensionImportColumnMap(sheet.getRow(1));
    expect(() => assertSuspensionImportHeadersComplete(colMap)).not.toThrow();
    expect(colMap.get('annee')).toBeDefined();
    expect(colMap.get('mois')).toBeDefined();
    expect(colMap.get('numeroFacture')).toBeDefined();
    expect(colMap.get('montant')).toBeDefined();
    expect(colMap.get('numeroVisa')).toBeDefined();
    expect(colMap.get('dateVisa')).toBeDefined();
  });

  it('parseOpSuspensionImportWorkbook réutilise un tiers existant par NINEA', async () => {
    const prisma = mockClientTierPrisma([
      { id: 'tier-by-ninea', name: 'Client A', ninea: 'SN111', meta: {} },
    ]);
    const buffer = await buildTestBuffer([
      HEADERS,
      [2025, 1, 'SN111', 'Autre nom', 'Dakar', 'SUSP-001', 100000, 18000, 'VISA-001', new Date('2025-01-20')],
    ]);

    const results = await parseOpSuspensionImportWorkbook(prisma as never, 'client-1', buffer);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      rowNumber: 2,
      tierCreated: false,
      tierUpdated: true,
      dto: {
        tierId: 'tier-by-ninea',
        code: 'SUSP-001',
        month: 1,
        year: 2025,
        net: 100000,
        tax: 18000,
        total: 118000,
        visaNumber: 'VISA-001',
      },
    });
    expect(prisma.tier.create).not.toHaveBeenCalled();
  });

  it('parseOpSuspensionImportWorkbook crée un tiers par dénomination si NINEA inconnu', async () => {
    const prisma = mockClientTierPrisma();
    const buffer = await buildTestBuffer([
      HEADERS,
      [2025, 2, 'SN999', 'Nouveau Client', 'Thiès', 'SUSP-002', 50000, 9000, 'VISA-002', new Date('2025-02-15')],
    ]);

    const results = await parseOpSuspensionImportWorkbook(prisma as never, 'client-1', buffer);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      rowNumber: 2,
      tierCreated: true,
      tierUpdated: false,
      dto: expect.objectContaining({
        tierId: 'tier-new',
        code: 'SUSP-002',
        month: 2,
        year: 2025,
        net: 50000,
        tax: 9000,
        total: 59000,
      }),
    });
    expect(prisma.tier.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Nouveau Client',
          ninea: 'SN999',
        }),
      }),
    );
  });
});
