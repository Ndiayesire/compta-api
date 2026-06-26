import ExcelJS from 'exceljs';
import type { PrismaService } from '../../../prisma/prisma.service';
import { normalizeImportHeader } from '../employees/employee-excel-import';
import { resolveTierForExportationImport, type ResolveTierForExportationResult } from '../op-exportations/op-exportation-excel-import';
import type { CreateOpSuspensionDto } from './dto/create-op-suspension.dto';

export type OpSuspensionImportColumnKey =
  | 'annee'
  | 'mois'
  | 'ninea'
  | 'denominationClient'
  | 'adresse'
  | 'numeroFacture'
  | 'montant'
  | 'tva'
  | 'numeroVisa'
  | 'dateVisa';

const HEADER_SYNONYMS: { key: OpSuspensionImportColumnKey; patterns: string[] }[] = [
  { key: 'annee', patterns: ['annee', 'année', 'year'] },
  { key: 'mois', patterns: ['mois', 'month'] },
  { key: 'ninea', patterns: ['ninea', 'n°inea', 'ninea client'] },
  {
    key: 'denominationClient',
    patterns: [
      'denomination du client',
      'dénomination du client',
      'denomination client',
      'dénomination client',
      'client',
    ],
  },
  { key: 'adresse', patterns: ['adresse', 'address'] },
  {
    key: 'numeroFacture',
    patterns: [
      'n°facture',
      'n° facture',
      'n facture',
      'numero facture',
      'numéro facture',
      'no facture',
      'facture',
    ],
  },
  { key: 'montant', patterns: ['montant', 'montant ht'] },
  { key: 'tva', patterns: ['tva'] },
  {
    key: 'numeroVisa',
    patterns: ['n° visa', 'n°visa', 'n visa', 'numero visa', 'numéro visa', 'no visa', 'visa'],
  },
  { key: 'dateVisa', patterns: ['date visa', 'date du visa'] },
];

const REQUIRED_KEYS: OpSuspensionImportColumnKey[] = [
  'annee',
  'mois',
  'numeroFacture',
  'montant',
  'tva',
  'numeroVisa',
  'dateVisa',
];

const MAX_IMPORT_ROWS = 500;

function matchColumnKey(normalizedHeader: string): OpSuspensionImportColumnKey | null {
  for (const { key, patterns } of HEADER_SYNONYMS) {
    for (const p of patterns) {
      if (normalizeImportHeader(p) === normalizedHeader) {
        return key;
      }
    }
  }
  return null;
}

export function buildSuspensionImportColumnMap(
  headerRow: ExcelJS.Row,
): Map<OpSuspensionImportColumnKey, number> {
  const map = new Map<OpSuspensionImportColumnKey, number>();
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const key = matchColumnKey(normalizeImportHeader(cell.value));
    if (key && !map.has(key)) {
      map.set(key, colNumber);
    }
  });
  return map;
}

export function assertSuspensionImportHeadersComplete(
  colMap: Map<OpSuspensionImportColumnKey, number>,
): void {
  const missing = REQUIRED_KEYS.filter((k) => !colMap.has(k));
  if (missing.length > 0) {
    throw new Error(
      `Colonnes obligatoires manquantes dans la 1ʳᵉ ligne : ${missing.join(', ')}. Vérifier le modèle suspensions-import-template.xlsx.`,
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

function parseMonth(sheet: ExcelJS.Worksheet, row: number, col: number | undefined): number {
  if (col === undefined) throw new Error('Mois manquant');
  const raw = cellText(sheet, row, col);
  if (!raw) throw new Error('Mois vide');
  const n = cellNumber(sheet, row, col);
  if (n === undefined || !Number.isInteger(n) || n < 1 || n > 12) {
    throw new Error(`Mois invalide : « ${raw} » — attendu un entier entre 1 et 12`);
  }
  return n;
}

function parseYear(sheet: ExcelJS.Worksheet, row: number, col: number | undefined): number {
  if (col === undefined) throw new Error('Année manquante');
  const raw = cellText(sheet, row, col);
  if (!raw) throw new Error('Année vide');
  const n = cellNumber(sheet, row, col);
  if (n === undefined || !Number.isInteger(n) || n < 1900 || n > 2100) {
    throw new Error(`Année invalide : « ${raw} » — attendu un entier entre 1900 et 2100`);
  }
  return n;
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

function periodDateIso(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`;
}

function isRowEmpty(
  sheet: ExcelJS.Worksheet,
  row: number,
  colMap: Map<OpSuspensionImportColumnKey, number>,
): boolean {
  for (const col of colMap.values()) {
    if (cellText(sheet, row, col)) return false;
  }
  return true;
}

export type ParsedOpSuspensionImportRow = {
  rowNumber: number;
  dto: CreateOpSuspensionDto;
  tierCreated: boolean;
  tierUpdated: boolean;
};

export type ParsedOpSuspensionImportError = {
  rowNumber: number;
  error: string;
};

export async function parseOpSuspensionImportWorkbook(
  prisma: PrismaService,
  clientId: string,
  buffer: Buffer,
): Promise<(ParsedOpSuspensionImportRow | ParsedOpSuspensionImportError)[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as never);

  const sheet = wb.worksheets[0];
  if (!sheet) {
    throw new Error('Le classeur ne contient aucune feuille');
  }

  const colMap = buildSuspensionImportColumnMap(sheet.getRow(1));
  assertSuspensionImportHeadersComplete(colMap);

  const tierCache = new Map<string, ResolveTierForExportationResult>();
  const results: (ParsedOpSuspensionImportRow | ParsedOpSuspensionImportError)[] = [];
  const lastRow = Math.min(sheet.rowCount || 1, MAX_IMPORT_ROWS + 1);

  for (let r = 2; r <= lastRow; r++) {
    if (isRowEmpty(sheet, r, colMap)) {
      continue;
    }
    try {
      const year = parseYear(sheet, r, colMap.get('annee'));
      const month = parseMonth(sheet, r, colMap.get('mois'));
      const ninea = cellText(sheet, r, colMap.get('ninea'));
      const denomination = cellText(sheet, r, colMap.get('denominationClient'));
      const adresse = cellText(sheet, r, colMap.get('adresse'));
      const code = cellText(sheet, r, colMap.get('numeroFacture'));
      if (!code) throw new Error('N° facture manquant');

      const net = parseRequiredAmount(sheet, r, colMap.get('montant'), 'MONTANT');
      const tax = parseRequiredAmount(sheet, r, colMap.get('tva'), 'TVA');
      const total = net + tax;

      const visaNumber = cellText(sheet, r, colMap.get('numeroVisa'));
      if (!visaNumber) throw new Error('N° visa manquant');
      const visaDate = parseImportDate(sheet, r, colMap.get('dateVisa'));

      const tier = await resolveTierForExportationImport(
        prisma,
        clientId,
        denomination,
        ninea,
        adresse,
        tierCache,
      );

      const dto: CreateOpSuspensionDto = {
        tierId: tier.tierId,
        code,
        date: periodDateIso(year, month),
        month,
        year,
        net,
        tax,
        total,
        visaDate,
        visaNumber,
      };

      results.push({
        rowNumber: r,
        dto,
        tierCreated: tier.created,
        tierUpdated: tier.updated,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push({ rowNumber: r, error: msg });
    }
  }

  return results;
}
