import ExcelJS from 'exceljs';
import type { PrismaService } from '../../../prisma/prisma.service';
import { normalizeImportHeader } from '../employees/employee-excel-import';

export type OpTurnoverStampImportColumnKey =
  | 'date'
  | 'numeroFacture'
  | 'libelle'
  | 'montantTtc'
  | 'taux1'
  | 'tseAPayer';

const HEADER_SYNONYMS: { key: OpTurnoverStampImportColumnKey; patterns: string[] }[] = [
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
  { key: 'montantTtc', patterns: ['montant ttc', 'ttc', 'montant'] },
  { key: 'taux1', patterns: ['taux 1%', 'taux 1', 'taux1', 'taux'] },
  { key: 'tseAPayer', patterns: ['tse a payer', 'tse à payer', 'tse', 'tse a paye'] },
];

const REQUIRED_KEYS: OpTurnoverStampImportColumnKey[] = [
  'date',
  'numeroFacture',
  'montantTtc',
  'tseAPayer',
];

const MAX_IMPORT_ROWS = 500;

function matchColumnKey(normalizedHeader: string): OpTurnoverStampImportColumnKey | null {
  for (const { key, patterns } of HEADER_SYNONYMS) {
    for (const p of patterns) {
      if (normalizeImportHeader(p) === normalizedHeader) {
        return key;
      }
    }
  }
  return null;
}

export function buildTurnoverStampImportColumnMap(
  headerRow: ExcelJS.Row,
): Map<OpTurnoverStampImportColumnKey, number> {
  const map = new Map<OpTurnoverStampImportColumnKey, number>();
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const key = matchColumnKey(normalizeImportHeader(cell.value));
    if (key && !map.has(key)) {
      map.set(key, colNumber);
    }
  });
  return map;
}

export function assertTurnoverStampImportHeadersComplete(
  colMap: Map<OpTurnoverStampImportColumnKey, number>,
): void {
  const missing = REQUIRED_KEYS.filter((k) => !colMap.has(k));
  if (missing.length > 0) {
    throw new Error(
      `Colonnes obligatoires manquantes dans la 1ʳᵉ ligne : ${missing.join(', ')}. Vérifier le modèle stamps-import-template.xlsx.`,
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
  if (n === undefined) {
    throw new Error(`${label} invalide ou manquant`);
  }
  return n;
}

function parseOptionalRate(sheet: ExcelJS.Worksheet, row: number, col: number | undefined): number | undefined {
  if (col === undefined) return undefined;
  const raw = cellText(sheet, row, col);
  if (!raw) return undefined;
  const pct = raw.replace(/\s/g, '').replace(',', '.');
  if (pct.endsWith('%')) {
    const n = Number(pct.slice(0, -1));
    return Number.isFinite(n) ? n / 100 : undefined;
  }
  const n = Number(pct);
  if (!Number.isFinite(n)) return undefined;
  return n > 1 ? n / 100 : n;
}

function isRowEmpty(
  sheet: ExcelJS.Worksheet,
  row: number,
  colMap: Map<OpTurnoverStampImportColumnKey, number>,
): boolean {
  for (const col of colMap.values()) {
    if (cellText(sheet, row, col)) return false;
  }
  return true;
}

export type ParsedOpTurnoverStampImportRow = {
  rowNumber: number;
  opTurnoverId: string | null;
  invoiceNumber: string;
  date: string;
  net: number;
  tax: number;
  total: number;
  amount: Record<string, unknown>;
  amountDeduction: Record<string, unknown>;
};

export type ParsedOpTurnoverStampImportError = {
  rowNumber: number;
  error: string;
};

export async function parseOpTurnoverStampImportWorkbook(
  prisma: PrismaService,
  clientId: string,
  companyId: string,
  buffer: Buffer,
): Promise<(ParsedOpTurnoverStampImportRow | ParsedOpTurnoverStampImportError)[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as never);

  const sheet = wb.worksheets[0];
  if (!sheet) {
    throw new Error('Le classeur ne contient aucune feuille');
  }

  const colMap = buildTurnoverStampImportColumnMap(sheet.getRow(1));
  assertTurnoverStampImportHeadersComplete(colMap);

  const results: (ParsedOpTurnoverStampImportRow | ParsedOpTurnoverStampImportError)[] = [];
  const lastRow = Math.min(sheet.rowCount || 1, MAX_IMPORT_ROWS + 1);

  for (let r = 2; r <= lastRow; r++) {
    if (isRowEmpty(sheet, r, colMap)) {
      continue;
    }
    try {
      const date = parseImportDate(sheet, r, colMap.get('date'));
      const invoiceNumber = cellText(sheet, r, colMap.get('numeroFacture'));
      if (!invoiceNumber) throw new Error('N° facture manquant');

      const total = parseRequiredAmount(sheet, r, colMap.get('montantTtc'), 'MONTANT TTC');
      const tax = parseRequiredAmount(sheet, r, colMap.get('tseAPayer'), 'TSE A PAYER');
      const net = total - tax;
      if (net < 0) {
        throw new Error('TSE A PAYER supérieur au MONTANT TTC');
      }

      const libelle = cellText(sheet, r, colMap.get('libelle'));
      const taux = parseOptionalRate(sheet, r, colMap.get('taux1'));

      const turnover = await prisma.opTurnover.findFirst({
        where: {
          number: invoiceNumber,
          deletedAt: null,
          clientId,
          client: { companyId, deletedAt: null },
        },
        select: { id: true },
      });

      const amountLines: { label: string; value: number }[] = [
        { label: libelle || 'Montant TTC', value: total },
      ];
      const deductionLines: { label: string; value: number }[] = [
        { label: 'TSE à payer', value: tax },
      ];
      if (taux !== undefined) {
        deductionLines.push({ label: 'Taux 1%', value: taux });
      }

      results.push({
        rowNumber: r,
        opTurnoverId: turnover?.id ?? null,
        invoiceNumber,
        date,
        net,
        tax,
        total,
        amount: { lines: amountLines },
        amountDeduction: { lines: deductionLines },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push({ rowNumber: r, error: msg });
    }
  }

  return results;
}
