import * as fs from 'fs';
import * as path from 'path';
import ExcelJS from 'exceljs';
import { assertTurnoverImportHeadersComplete, buildTurnoverImportColumnMap } from './op-turnover-excel-import';

const TEMPLATE_PATH = path.join(
  __dirname,
  '..',
  '..',
  'assets',
  'xlsx',
  'turnovers-import-template.xlsx',
);

describe('op-turnover-excel-import', () => {
  it('reconnaît les en-têtes du modèle turnovers-import-template.xlsx', async () => {
    expect(fs.existsSync(TEMPLATE_PATH)).toBe(true);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(TEMPLATE_PATH);
    const sheet = wb.worksheets[0];
    const colMap = buildTurnoverImportColumnMap(sheet.getRow(1));
    expect(() => assertTurnoverImportHeadersComplete(colMap)).not.toThrow();
    expect(colMap.get('date')).toBeDefined();
    expect(colMap.get('numeroFacture')).toBeDefined();
    expect(colMap.get('libelle')).toBeDefined();
    expect(colMap.get('montantHt')).toBeDefined();
    expect(colMap.get('ttc')).toBeDefined();
  });
});
