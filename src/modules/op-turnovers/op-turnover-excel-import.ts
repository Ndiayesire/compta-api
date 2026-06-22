import ExcelJS from 'exceljs';
import type { PrismaService } from '../../../prisma/prisma.service';
import { normalizeImportHeader } from '../employees/employee-excel-import';
import type { CreateOpTurnoverDto } from './dto/create-op-turnover.dto';

export type OpTurnoverImportColumnKey =
  | 'date'
  | 'numeroFacture'
  | 'libelle'
  | 'montantHt'
  | 'tva'
  | 'ttc';

const HEADER_SYNONYMS: { key: OpTurnoverImportColumnKey; patterns: string[] }[] = [
  { key: 'date', patterns: ['dates', 'date'] },
  {
    key: 'numeroFacture',
    patterns: [
      'n° facture',
      'n°facture',
      'n facture',
      'numero facture',
      'numéro facture',
      'no facture',
      'facture',
    ],
  },
  { key: 'libelle', patterns: ['libelles', 'libellés', 'libelle', 'libellé', 'label'] },
  { key: 'montantHt', patterns: ['montant ht', 'montant'] },
  { key: 'tva', patterns: ['tva'] },
  { key: 'ttc', patterns: ['ttc', 'montant ttc', 'total'] },
];

const REQUIRED_KEYS: OpTurnoverImportColumnKey[] = [
  'date',
  'numeroFacture',
  'montantHt',
  'tva',
  'ttc',
];

const MAX_IMPORT_ROWS = 500;

function matchColumnKey(normalizedHeader: string): OpTurnoverImportColumnKey | null {
  for (const { key, patterns } of HEADER_SYNONYMS) {
    for (const p of patterns) {
      if (normalizeImportHeader(p) === normalizedHeader) {
        return key;
      }
    }
  }
  return null;
}

export function buildTurnoverImportColumnMap(
  headerRow: ExcelJS.Row,
): Map<OpTurnoverImportColumnKey, number> {
  const map = new Map<OpTurnoverImportColumnKey, number>();
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const key = matchColumnKey(normalizeImportHeader(cell.value));
    if (key && !map.has(key)) {
      map.set(key, colNumber);
    }
  });
  return map;
}

export function assertTurnoverImportHeadersComplete(
  colMap: Map<OpTurnoverImportColumnKey, number>,
): void {
  const missing = REQUIRED_KEYS.filter((k) => !colMap.has(k));
  if (missing.length > 0) {
    throw new Error(
      `Colonnes obligatoires manquantes dans la 1ʳᵉ ligne : ${missing.join(', ')}. Vérifier le modèle turnovers-import-template.xlsx.`,
    );
  }
}

function cellText(sheet: ExcelJS.Worksheet, row: number, col: number | undefined): string {
  if (col === undefined) return '';
  const cell = sheet.getCell(row, col);
  const v = cell.value;
  if (v == null) return '';
  if (v instanceof Date) {
    return v.toISOString();
  }
  if (typeof v === 'string' || typeof v === 'number') {
    return String(v).trim();
  }
  if (typeof v === 'boolean') {
    return v ? 'TRUE' : 'FALSE';
  }
  if (
    typeof v === 'object' &&
    v !== null &&
    'richText' in v &&
    Array.isArray((v as ExcelJS.CellRichTextValue).richText)
  ) {
    return (v as ExcelJS.CellRichTextValue).richText.map((t) => t.text).join('').trim();
  }
  if (typeof v === 'object' && v !== null && 'text' in v) {
    return String((v as { text: string }).text).trim();
  }
  if (typeof v === 'object' && v !== null && 'result' in v) {
    const r = (v as ExcelJS.CellFormulaValue).result;
    return r == null ? '' : String(r).trim();
  }
  return String(v).trim();
}

function cellNumber(sheet: ExcelJS.Worksheet, row: number, col: number | undefined): number | undefined {
  if (col === undefined) return undefined;
  const cell = sheet.getCell(row, col);
  const v = cell.value;
  if (v == null || v === '') return undefined;
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  const t = cellText(sheet, row, col).replace(/\s/g, '').replace(',', '.');
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

function parseImportDate(sheet: ExcelJS.Worksheet, row: number, col: number | undefined): string {
  if (col === undefined) throw new Error('Date manquante');
  const cell = sheet.getCell(row, col);
  const v = cell.value;
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return v.toISOString();
  }
  const raw = cellText(sheet, row, col);
  if (!raw) throw new Error('Date vide');
  const slash = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (slash) {
    return `${slash[3]}-${slash[2].padStart(2, '0')}-${slash[1].padStart(2, '0')}T00:00:00.000Z`;
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Date invalide : « ${raw} »`);
  }
  return d.toISOString();
}

function parseRequiredAmount(
  sheet: ExcelJS.Worksheet,
  row: number,
  col: number | undefined,
  label: string,
): number {
  const n = cellNumber(sheet, row, col);
  if (n === undefined || n < 0) {
    throw new Error(`${label} invalide ou manquant`);
  }
  return n;
}

function isRowEmpty(
  sheet: ExcelJS.Worksheet,
  row: number,
  colMap: Map<OpTurnoverImportColumnKey, number>,
): boolean {
  for (const col of colMap.values()) {
    if (cellText(sheet, row, col)) return false;
  }
  return true;
}

export type ParsedOpTurnoverImportRow =
  | { rowNumber: number; dto: CreateOpTurnoverDto }
  | { rowNumber: number; error: string };

export async function parseOpTurnoverImportWorkbook(
  _prisma: PrismaService,
  clientId: string,
  buffer: Buffer,
): Promise<ParsedOpTurnoverImportRow[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as never);

  const sheet = wb.worksheets[0];
  if (!sheet) {
    throw new Error('Le classeur ne contient aucune feuille');
  }

  const colMap = buildTurnoverImportColumnMap(sheet.getRow(1));
  assertTurnoverImportHeadersComplete(colMap);

  const results: ParsedOpTurnoverImportRow[] = [];
  const lastRow = Math.min(sheet.rowCount || 1, MAX_IMPORT_ROWS + 1);

  for (let r = 2; r <= lastRow; r++) {
    if (isRowEmpty(sheet, r, colMap)) {
      continue;
    }
    try {
      const date = parseImportDate(sheet, r, colMap.get('date'));
      const number = cellText(sheet, r, colMap.get('numeroFacture'));
      if (!number) throw new Error('N° facture manquant');

      const net = parseRequiredAmount(sheet, r, colMap.get('montantHt'), 'MONTANT HT');
      const tax = parseRequiredAmount(sheet, r, colMap.get('tva'), 'TVA');
      const totalFromCol = cellNumber(sheet, r, colMap.get('ttc'));
      const total = totalFromCol !== undefined && totalFromCol >= 0 ? totalFromCol : net + tax;

      const dto: CreateOpTurnoverDto = {
        clientId,
        number,
        date,
        net,
        tax,
        total,
      };

      results.push({ rowNumber: r, dto });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push({ rowNumber: r, error: msg });
    }
  }

  return results;
}
