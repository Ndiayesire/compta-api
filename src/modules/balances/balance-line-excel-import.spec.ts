import * as fs from 'fs';
import * as path from 'path';
import ExcelJS from 'exceljs';
import { parseBalanceLineImportWorkbook } from './balance-line-excel-import';

describe('parseBalanceLineImportWorkbook', () => {
  const examplePath = path.join(
    __dirname,
    '..',
    '..',
    'assets',
    'xlsx',
    'balance-lines-import-example.xlsx',
  );

  it('parse le fichier modèle (8 colonnes, lignes seed)', async () => {
    const buf = fs.readFileSync(examplePath);
    const rows = await parseBalanceLineImportWorkbook(buf);
    const ok = rows.filter((r) => !('error' in r));
    expect(ok.length).toBeGreaterThanOrEqual(1);
    const first = ok[0] as {
      number: string;
      name: string;
      previousSold: number;
      currentSold: number;
    };
    expect(first.number).toBeTruthy();
    expect(first.name).toBeTruthy();
    expect(typeof first.previousSold).toBe('number');
    expect(typeof first.currentSold).toBe('number');
  });

  it('rejette un classeur sans les 8 en-têtes reconnus', async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('x');
    ws.getRow(1).getCell(1).value = 'Colonne seule';
    const buf = Buffer.from(await wb.xlsx.writeBuffer());
    await expect(parseBalanceLineImportWorkbook(buf)).rejects.toThrow(
      /Colonnes manquantes/i,
    );
  });
});
