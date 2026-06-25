import * as fs from 'fs';
import * as path from 'path';
import ExcelJS from 'exceljs';
import {
  assertTurnoverStampImportHeadersComplete,
  buildTurnoverStampImportColumnMap,
} from './op-turnover-stamp-excel-import';

const TEMPLATE_PATH = path.join(
  __dirname,
  '..',
  '..',
  'assets',
  'xlsx',
  'stamps-import-template.xlsx',
);

describe('op-turnover-stamp-excel-import', () => {
  it('reconnaît les en-têtes du modèle stamps-import-template.xlsx', async () => {
    expect(fs.existsSync(TEMPLATE_PATH)).toBe(true);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(TEMPLATE_PATH);
    const sheet = wb.worksheets[0];
    const colMap = buildTurnoverStampImportColumnMap(sheet.getRow(1));
    expect(() => assertTurnoverStampImportHeadersComplete(colMap)).not.toThrow();
    expect(colMap.get('date')).toBeDefined();
    expect(colMap.get('numeroFacture')).toBeDefined();
    expect(colMap.get('montantTtc')).toBeDefined();
    expect(colMap.get('tseAPayer')).toBeDefined();
  });
});
