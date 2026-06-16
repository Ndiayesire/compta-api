import ExcelJS from 'exceljs';
import type { PrismaService } from '../../../prisma/prisma.service';
import { normalizeImportHeader } from '../employees/employee-excel-import';
import type { CreateOpExemptionDto } from './dto/create-op-exemption.dto';

export type OpExemptionImportColumnKey =
  | 'moisDeclaration'
  | 'numeroFacture'
  | 'montantHt'
  | 'client'
  | 'motif';

const HEADER_SYNONYMS: { key: OpExemptionImportColumnKey; patterns: string[] }[] = [
  {
    key: 'moisDeclaration',
    patterns: ['mois de la declaration', 'mois declaration', 'mois'],
  },
  {
    key: 'numeroFacture',
    patterns: ['n° facture', 'n facture', 'numero facture', 'numéro facture', 'facture'],
  },
  {
    key: 'montantHt',
    patterns: ['montant ht', 'montant'],
  },
  { key: 'client', patterns: ['client'] },
  { key: 'motif', patterns: ['motif', 'description'] },
];

const REQUIRED_KEYS: OpExemptionImportColumnKey[] = [
  'moisDeclaration',
  'numeroFacture',
  'montantHt',
  'client',
  'motif',
];

const MAX_IMPORT_ROWS = 500;

function matchColumnKey(normalizedHeader: string): OpExemptionImportColumnKey | null {
  for (const { key, patterns } of HEADER_SYNONYMS) {
    for (const p of patterns) {
      if (normalizeImportHeader(p) === normalizedHeader) {
        return key;
      }
    }
  }
  return null;
}

export function buildExemptionImportColumnMap(headerRow: ExcelJS.Row): Map<OpExemptionImportColumnKey, number> {
  const map = new Map<OpExemptionImportColumnKey, number>();
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const key = matchColumnKey(normalizeImportHeader(cell.value));
    if (key && !map.has(key)) {
      map.set(key, colNumber);
    }
  });
  return map;
}

export function assertExemptionImportHeadersComplete(colMap: Map<OpExemptionImportColumnKey, number>): void {
  const missing = REQUIRED_KEYS.filter((k) => !colMap.has(k));
  if (missing.length > 0) {
    throw new Error(
      `Colonnes obligatoires manquantes dans la 1ʳᵉ ligne : ${missing.join(', ')}. Vérifier le modèle exemptions-import-template.xlsx.`,
    );
  }
}

function cellText(sheet: ExcelJS.Worksheet, row: number, col: number | undefined): string {
  if (col === undefined) return '';
  const cell = sheet.getCell(row, col);
  const v = cell.value;
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number') {
    return String(v).trim();
  }
  if (typeof v === 'boolean') {
    return v ? 'TRUE' : 'FALSE';
  }
  if (typeof v === 'object' && v !== null && 'richText' in v && Array.isArray((v as ExcelJS.CellRichTextValue).richText)) {
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

/** Mois de déclaration : entier **1–12** (colonne « MOIS DE LA DECLARATION »). */
export function parseDeclarationMonth(
  sheet: ExcelJS.Worksheet,
  row: number,
  col: number | undefined,
): number {
  if (col === undefined) {
    throw new Error('Mois de la déclaration manquant');
  }
  const raw = cellText(sheet, row, col);
  if (!raw) {
    throw new Error('Mois de la déclaration vide');
  }
  const n = cellNumber(sheet, row, col);
  if (n === undefined || !Number.isInteger(n) || n < 1 || n > 12) {
    throw new Error(
      `Mois de la déclaration invalide : « ${raw} » — attendu un entier entre 1 et 12`,
    );
  }
  return n;
}

function eqInsensitive(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function slugReference(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toUpperCase()
    .slice(0, 200);
  return `IMP-${base || 'TIER'}`;
}

async function resolveDefaultCustomerTierTypeId(prisma: PrismaService): Promise<string> {
  const types = await prisma.tierType.findMany({
    where: { isActive: true },
    select: { id: true, name: true, code: true },
  });
  const customer = types.find(
    (t) =>
      eqInsensitive(t.code, 'CLIENT') ||
      eqInsensitive(t.code, 'CUSTOMER') ||
      eqInsensitive(t.name, 'Client'),
  );
  if (customer) return customer.id;
  if (types.length === 0) {
    throw new Error('Aucun type de tiers actif en base — impossible de créer un tiers importé');
  }
  return types[0].id;
}

/**
 * Cherche un tiers par **nom** (insensible à la casse) pour le `clientId` fourni.
 * S'il n'existe pas, le crée avec ce `clientId` (type « Client » par défaut).
 */
export async function findOrCreateTierIdByClientName(
  prisma: PrismaService,
  clientId: string,
  name: string,
  cache: Map<string, string>,
): Promise<{ tierId: string; created: boolean }> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Nom client (colonne CLIENT) vide');
  }

  const cacheKey = trimmed.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached) {
    return { tierId: cached, created: false };
  }

  const tiers = await prisma.tier.findMany({
    where: { clientId, deletedAt: null },
    select: { id: true, name: true },
  });
  const matches = tiers.filter((t) => eqInsensitive(t.name, trimmed));
  if (matches.length > 1) {
    throw new Error(`Plusieurs tiers nommés « ${trimmed} » pour ce client`);
  }
  if (matches.length === 1) {
    cache.set(cacheKey, matches[0].id);
    return { tierId: matches[0].id, created: false };
  }

  const tierTypeId = await resolveDefaultCustomerTierTypeId(prisma);
  const created = await prisma.tier.create({
    data: {
      clientId,
      tierTypeId,
      name: trimmed,
      ninea: 'NA',
      reference: slugReference(trimmed),
      useTva: true,
      meta: { importedFromExemption: true },
      isActive: true,
    },
    select: { id: true },
  });
  cache.set(cacheKey, created.id);
  return { tierId: created.id, created: true };
}

function isRowEmpty(sheet: ExcelJS.Worksheet, row: number, colMap: Map<OpExemptionImportColumnKey, number>): boolean {
  for (const col of colMap.values()) {
    if (cellText(sheet, row, col)) return false;
  }
  return true;
}

export type ParsedOpExemptionImportRow =
  | { rowNumber: number; dto: CreateOpExemptionDto; tierCreated?: boolean }
  | { rowNumber: number; error: string };

export async function parseOpExemptionImportWorkbook(
  prisma: PrismaService,
  clientId: string,
  year: number,
  buffer: Buffer,
): Promise<ParsedOpExemptionImportRow[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as never);

  const sheet = wb.worksheets[0];
  if (!sheet) {
    throw new Error('Le classeur ne contient aucune feuille');
  }

  const colMap = buildExemptionImportColumnMap(sheet.getRow(1));
  assertExemptionImportHeadersComplete(colMap);

  const results: ParsedOpExemptionImportRow[] = [];
  const lastRow = Math.min(sheet.rowCount || 1, MAX_IMPORT_ROWS + 1);
  const tierCache = new Map<string, string>();

  for (let r = 2; r <= lastRow; r++) {
    if (isRowEmpty(sheet, r, colMap)) {
      continue;
    }
    try {
      const month = parseDeclarationMonth(sheet, r, colMap.get('moisDeclaration'));
      const code = cellText(sheet, r, colMap.get('numeroFacture'));
      const amount = cellNumber(sheet, r, colMap.get('montantHt'));
      const clientLabel = cellText(sheet, r, colMap.get('client'));
      const desc = cellText(sheet, r, colMap.get('motif'));

      if (!code) throw new Error('N° facture manquant');
      if (amount === undefined || amount < 0) throw new Error('Montant HT invalide');
      if (!desc) throw new Error('Motif manquant');

      const { tierId, created } = await findOrCreateTierIdByClientName(
        prisma,
        clientId,
        clientLabel,
        tierCache,
      );

      results.push({
        rowNumber: r,
        dto: { tierId, code, month, year, amount, desc },
        ...(created ? { tierCreated: true } : {}),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push({ rowNumber: r, error: msg });
    }
  }

  return results;
}
