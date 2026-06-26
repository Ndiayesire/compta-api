import ExcelJS from 'exceljs';
import type { PrismaService } from '../../../prisma/prisma.service';
import { normalizeImportHeader } from '../employees/employee-excel-import';
import { resolveSupplierTierForImport, type ResolveSupplierTierResult } from '../op-importations/op-importation-excel-import';
import type { CreateOpRoyaltyDto } from './dto/create-op-royalty.dto';

export type OpRoyaltyImportColumnKey =
  | 'raisonSociale'
  | 'adresse'
  | 'numeroFacture'
  | 'date'
  | 'base'
  | 'taux'
  | 'montant';

const HEADER_SYNONYMS: { key: OpRoyaltyImportColumnKey; patterns: string[] }[] = [
  {
    key: 'raisonSociale',
    patterns: [
      'raison sociale du fournisseur',
      'raison sociale',
      'fournisseur',
      'supplier',
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
  { key: 'date', patterns: ['date', 'dates'] },
  { key: 'base', patterns: ['base'] },
  { key: 'taux', patterns: ['taux', 'rate'] },
  { key: 'montant', patterns: ['montant', 'amount'] },
];

const REQUIRED_KEYS: OpRoyaltyImportColumnKey[] = [
  'raisonSociale',
  'numeroFacture',
  'date',
  'base',
  'taux',
  'montant',
];

const MAX_IMPORT_ROWS = 500;

function matchColumnKey(normalizedHeader: string): OpRoyaltyImportColumnKey | null {
  for (const { key, patterns } of HEADER_SYNONYMS) {
    for (const p of patterns) {
      if (normalizeImportHeader(p) === normalizedHeader) {
        return key;
      }
    }
  }
  return null;
}

export function buildRoyaltyImportColumnMap(headerRow: ExcelJS.Row): Map<OpRoyaltyImportColumnKey, number> {
  const map = new Map<OpRoyaltyImportColumnKey, number>();
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const key = matchColumnKey(normalizeImportHeader(cell.value));
    if (key && !map.has(key)) {
      map.set(key, colNumber);
    }
  });
  return map;
}

export function assertRoyaltyImportHeadersComplete(colMap: Map<OpRoyaltyImportColumnKey, number>): void {
  const missing = REQUIRED_KEYS.filter((k) => !colMap.has(k));
  if (missing.length > 0) {
    throw new Error(
      `Colonnes obligatoires manquantes dans la 1ʳᵉ ligne : ${missing.join(', ')}. Vérifier le modèle royalties-import-template.xlsx.`,
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

function parseRate(sheet: ExcelJS.Worksheet, row: number, col: number | undefined): number {
  const raw = cellText(sheet, row, col);
  if (!raw) throw new Error('TAUX invalide ou manquant');
  const pct = raw.replace(/\s/g, '').replace(',', '.');
  if (pct.endsWith('%')) {
    const n = Number(pct.slice(0, -1));
    if (!Number.isFinite(n) || n < 0) throw new Error(`TAUX invalide : « ${raw} »`);
    return n;
  }
  const n = Number(pct);
  if (!Number.isFinite(n) || n < 0) throw new Error(`TAUX invalide : « ${raw} »`);
  return n > 0 && n <= 1 ? n * 100 : n;
}

function isRowEmpty(
  sheet: ExcelJS.Worksheet,
  row: number,
  colMap: Map<OpRoyaltyImportColumnKey, number>,
): boolean {
  for (const col of colMap.values()) {
    if (cellText(sheet, row, col)) return false;
  }
  return true;
}

export type ParsedOpRoyaltyImportRow = {
  rowNumber: number;
  dto: CreateOpRoyaltyDto;
  tierCreated: boolean;
};

export type ParsedOpRoyaltyImportError = {
  rowNumber: number;
  error: string;
};

export async function parseOpRoyaltyImportWorkbook(
  prisma: PrismaService,
  clientId: string,
  buffer: Buffer,
): Promise<(ParsedOpRoyaltyImportRow | ParsedOpRoyaltyImportError)[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as never);

  const sheet = wb.worksheets[0];
  if (!sheet) {
    throw new Error('Le classeur ne contient aucune feuille');
  }

  const colMap = buildRoyaltyImportColumnMap(sheet.getRow(1));
  assertRoyaltyImportHeadersComplete(colMap);

  const tierCache = new Map<string, ResolveSupplierTierResult>();
  const results: (ParsedOpRoyaltyImportRow | ParsedOpRoyaltyImportError)[] = [];
  const lastRow = Math.min(sheet.rowCount || 1, MAX_IMPORT_ROWS + 1);

  for (let r = 2; r <= lastRow; r++) {
    if (isRowEmpty(sheet, r, colMap)) {
      continue;
    }
    try {
      const raisonSociale = cellText(sheet, r, colMap.get('raisonSociale'));
      const adresse = cellText(sheet, r, colMap.get('adresse'));
      const code = cellText(sheet, r, colMap.get('numeroFacture'));
      if (!code) throw new Error('N° facture manquant');

      const dateIso = parseImportDate(sheet, r, colMap.get('date'));
      const dateObj = new Date(dateIso);
      const month = dateObj.getUTCMonth() + 1;
      const year = dateObj.getUTCFullYear();

      const base = parseRequiredAmount(sheet, r, colMap.get('base'), 'BASE');
      const rate = parseRate(sheet, r, colMap.get('taux'));
      const amount = parseRequiredAmount(sheet, r, colMap.get('montant'), 'MONTANT');

      const tier = await resolveSupplierTierForImport(
        prisma,
        clientId,
        raisonSociale,
        adresse,
        tierCache,
      );

      const dto: CreateOpRoyaltyDto = {
        tierId: tier.tierId,
        code,
        date: dateIso,
        month,
        year,
        base,
        rate,
        amount,
      };

      results.push({ rowNumber: r, dto, tierCreated: tier.created });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push({ rowNumber: r, error: msg });
    }
  }

  return results;
}
