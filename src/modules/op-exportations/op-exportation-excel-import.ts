import ExcelJS from 'exceljs';
import { Prisma } from '@prisma/client';
import type { PrismaService } from '../../../prisma/prisma.service';
import { normalizeImportHeader } from '../employees/employee-excel-import';
import type { CreateOpExportationDto } from './dto/create-op-exportation.dto';

export type OpExportationImportColumnKey =
  | 'annee'
  | 'mois'
  | 'ninea'
  | 'client'
  | 'adresse'
  | 'pays'
  | 'numeroFacture'
  | 'montant';

const HEADER_SYNONYMS: { key: OpExportationImportColumnKey; patterns: string[] }[] = [
  { key: 'annee', patterns: ['annee', 'année', 'year'] },
  { key: 'mois', patterns: ['mois', 'month'] },
  { key: 'ninea', patterns: ['ninea', 'ninea client'] },
  { key: 'client', patterns: ['client'] },
  { key: 'adresse', patterns: ['adresse', 'address'] },
  { key: 'pays', patterns: ['pays', 'country'] },
  {
    key: 'numeroFacture',
    patterns: ['n° facture', 'n°facture', 'n facture', 'numero facture', 'numéro facture', 'facture'],
  },
  { key: 'montant', patterns: ['montant', 'montant ht', 'montant total'] },
];

const REQUIRED_KEYS: OpExportationImportColumnKey[] = [
  'annee',
  'mois',
  'client',
  'pays',
  'numeroFacture',
  'montant',
];

const MAX_IMPORT_ROWS = 500;

function matchColumnKey(normalizedHeader: string): OpExportationImportColumnKey | null {
  for (const { key, patterns } of HEADER_SYNONYMS) {
    for (const p of patterns) {
      if (normalizeImportHeader(p) === normalizedHeader) {
        return key;
      }
    }
  }
  return null;
}

export function buildExportationImportColumnMap(
  headerRow: ExcelJS.Row,
): Map<OpExportationImportColumnKey, number> {
  const map = new Map<OpExportationImportColumnKey, number>();
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const key = matchColumnKey(normalizeImportHeader(cell.value));
    if (key && !map.has(key)) {
      map.set(key, colNumber);
    }
  });
  return map;
}

export function assertExportationImportHeadersComplete(
  colMap: Map<OpExportationImportColumnKey, number>,
): void {
  const missing = REQUIRED_KEYS.filter((k) => !colMap.has(k));
  if (missing.length > 0) {
    throw new Error(
      `Colonnes obligatoires manquantes dans la 1ʳᵉ ligne : ${missing.join(', ')}. Vérifier le modèle exportations-import-template.xlsx.`,
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
  const raw = cellText(sheet, row, col);
  if (!raw) throw new Error('Mois vide');
  const n = cellNumber(sheet, row, col);
  if (n === undefined || !Number.isInteger(n) || n < 1 || n > 12) {
    throw new Error(`Mois invalide : « ${raw} » — attendu un entier entre 1 et 12`);
  }
  return n;
}

function parseYear(sheet: ExcelJS.Worksheet, row: number, col: number | undefined): number {
  const raw = cellText(sheet, row, col);
  if (!raw) throw new Error('Année vide');
  const n = cellNumber(sheet, row, col);
  if (n === undefined || !Number.isInteger(n) || n < 1900 || n > 2100) {
    throw new Error(`Année invalide : « ${raw} » — attendu un entier entre 1900 et 2100`);
  }
  return n;
}

function monthDateIso(year: number, month: number): string {
  const mm = String(month).padStart(2, '0');
  return `${year}-${mm}-01T00:00:00.000Z`;
}

/** Comparaison insensible à la casse et aux accents (ex. Sénégal = Senegal). */
export function normalizeLabelForMatch(value: string): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function eqAccentInsensitive(a: string, b: string): boolean {
  return normalizeLabelForMatch(a) === normalizeLabelForMatch(b);
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
  return `EXP-${base || 'TIER'}`;
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

export async function findCountryIdByName(prisma: PrismaService, label: string): Promise<string> {
  const trimmed = label.trim();
  if (!trimmed) {
    throw new Error('Pays vide');
  }
  const countries = await prisma.country.findMany({
    where: { isActive: true },
    select: { id: true, name: true, code: true },
  });
  const matches = countries.filter(
    (c) =>
      eqAccentInsensitive(c.name, trimmed) ||
      eqAccentInsensitive(c.code, trimmed) ||
      eqInsensitive(c.code, trimmed),
  );
  if (matches.length > 1) {
    throw new Error(`Plusieurs pays correspondent à « ${trimmed} »`);
  }
  if (matches.length === 0) {
    throw new Error(`Pays inconnu : « ${trimmed} »`);
  }
  return matches[0].id;
}

export type ResolveCountryResult = {
  countryId: string;
  created: boolean;
};

function inferCountryCodeFromName(name: string): string {
  const letters = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase();
  if (letters.length >= 2) {
    return letters.slice(0, 3);
  }
  return 'XX';
}

async function pickUniqueCountryCode(prisma: PrismaService, base: string): Promise<string> {
  let candidate = base.slice(0, 3) || 'XX';
  for (let i = 0; i < 100; i++) {
    const code = i === 0 ? candidate : `${candidate.slice(0, 2)}${i}`;
    const existing = await prisma.country.findFirst({
      where: { code },
      select: { id: true },
    });
    if (!existing) return code.slice(0, 3);
  }
  throw new Error(`Impossible de générer un code pays unique pour « ${base} »`);
}

async function resolveDefaultCurrencyId(prisma: PrismaService): Promise<string> {
  const xof = await prisma.currency.findFirst({
    where: { code: 'XOF', isActive: true },
    select: { id: true },
  });
  if (xof) return xof.id;
  const any = await prisma.currency.findFirst({
    where: { isActive: true },
    select: { id: true },
    orderBy: { code: 'asc' },
  });
  if (!any) {
    throw new Error('Aucune devise active en base — impossible de créer un pays importé');
  }
  return any.id;
}

export async function findOrCreateCountryIdByName(
  prisma: PrismaService,
  label: string,
  cache: Map<string, ResolveCountryResult>,
): Promise<ResolveCountryResult> {
  const trimmed = label.trim();
  if (!trimmed) {
    throw new Error('Pays vide');
  }

  const cacheKey = normalizeLabelForMatch(trimmed);
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const countries = await prisma.country.findMany({
    where: { isActive: true },
    select: { id: true, name: true, code: true },
  });
  const matches = countries.filter(
    (c) =>
      eqAccentInsensitive(c.name, trimmed) ||
      eqAccentInsensitive(c.code, trimmed) ||
      eqInsensitive(c.code, trimmed),
  );
  if (matches.length > 1) {
    throw new Error(`Plusieurs pays correspondent à « ${trimmed} »`);
  }
  if (matches.length === 1) {
    const result = { countryId: matches[0].id, created: false };
    cache.set(cacheKey, result);
    return result;
  }

  const currencyId = await resolveDefaultCurrencyId(prisma);
  const code = await pickUniqueCountryCode(prisma, inferCountryCodeFromName(trimmed));
  const created = await prisma.country.create({
    data: {
      currencyId,
      name: trimmed,
      code,
      tva: 0,
      callingCode: '+0',
      isActive: true,
    },
    select: { id: true },
  });
  const result = { countryId: created.id, created: true };
  cache.set(cacheKey, result);
  return result;
}

function mergeTierAddressMeta(adresse: string, existingMeta: unknown): Prisma.InputJsonValue {
  const base =
    typeof existingMeta === 'object' && existingMeta !== null && !Array.isArray(existingMeta)
      ? { ...(existingMeta as Record<string, Prisma.InputJsonValue>) }
      : {};
  if (adresse.trim()) {
    return {
      ...base,
      beneficiaryAddress: adresse.trim(),
      address: adresse.trim(),
    };
  }
  return base;
}

export type ResolveTierForExportationResult = {
  tierId: string;
  created: boolean;
  updated: boolean;
};

/**
 * 1. Cherche le tiers par **NINEA** (pour le `clientId`).
 * 2. Sinon, par **nom** client (casse + accents).
 * 3. Si trouvé par nom → met à jour NINEA + adresse.
 * 4. Si trouvé par NINEA → met à jour l'adresse si fournie.
 * 5. Sinon → crée un nouveau tiers.
 */
export async function resolveTierForExportationImport(
  prisma: PrismaService,
  clientId: string,
  name: string,
  ninea: string,
  adresse: string,
  cache: Map<string, ResolveTierForExportationResult>,
): Promise<ResolveTierForExportationResult> {
  const trimmedName = name.trim();
  const trimmedNinea = ninea.trim();
  if (!trimmedName && !trimmedNinea) {
    throw new Error('CLIENT ou NINEA requis');
  }

  const cacheKey = `${normalizeLabelForMatch(trimmedName)}|${normalizeLabelForMatch(trimmedNinea)}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const tiers = await prisma.tier.findMany({
    where: { clientId, deletedAt: null },
    select: { id: true, name: true, ninea: true, meta: true },
  });

  if (trimmedNinea) {
    const byNinea = tiers.filter((t) => eqInsensitive(t.ninea, trimmedNinea));
    if (byNinea.length > 1) {
      throw new Error(`Plusieurs tiers avec le NINEA « ${trimmedNinea} » pour ce client`);
    }
    if (byNinea.length === 1) {
      const tier = byNinea[0];
      let updated = false;
      if (adresse.trim()) {
        await prisma.tier.update({
          where: { id: tier.id },
          data: { meta: mergeTierAddressMeta(adresse, tier.meta) },
        });
        updated = true;
      }
      const result = { tierId: tier.id, created: false, updated };
      cache.set(cacheKey, result);
      return result;
    }
  }

  if (trimmedName) {
    const byName = tiers.filter((t) => eqAccentInsensitive(t.name, trimmedName));
    if (byName.length > 1) {
      throw new Error(`Plusieurs tiers nommés « ${trimmedName} » pour ce client`);
    }
    if (byName.length === 1) {
      const tier = byName[0];
      const data: { ninea?: string; meta?: Prisma.InputJsonValue } = {};
      if (trimmedNinea) {
        data.ninea = trimmedNinea;
      }
      if (adresse.trim()) {
        data.meta = mergeTierAddressMeta(adresse, tier.meta);
      } else if (trimmedNinea) {
        data.meta = mergeTierAddressMeta('', tier.meta);
      }
      const shouldUpdate = trimmedNinea.length > 0 || adresse.trim().length > 0;
      if (shouldUpdate) {
        await prisma.tier.update({ where: { id: tier.id }, data });
      }
      const result = { tierId: tier.id, created: false, updated: shouldUpdate };
      cache.set(cacheKey, result);
      return result;
    }
  }

  const tierTypeId = await resolveDefaultCustomerTierTypeId(prisma);
  const displayName = trimmedName || `Tiers ${trimmedNinea}`;
  const meta = {
    importedFromExportation: true,
    ...(adresse.trim()
      ? { beneficiaryAddress: adresse.trim(), address: adresse.trim() }
      : {}),
  };

  const created = await prisma.tier.create({
    data: {
      clientId,
      tierTypeId,
      name: displayName,
      ninea: trimmedNinea || 'NA',
      reference: slugReference(displayName),
      useTva: true,
      meta,
      isActive: true,
    },
    select: { id: true },
  });
  const result = { tierId: created.id, created: true, updated: false };
  cache.set(cacheKey, result);
  return result;
}

function isRowEmpty(
  sheet: ExcelJS.Worksheet,
  row: number,
  colMap: Map<OpExportationImportColumnKey, number>,
): boolean {
  for (const col of colMap.values()) {
    if (cellText(sheet, row, col)) return false;
  }
  return true;
}

export type ParsedOpExportationImportRow =
  | { rowNumber: number; dto: CreateOpExportationDto; tierCreated?: boolean; tierUpdated?: boolean }
  | { rowNumber: number; error: string };

export async function parseOpExportationImportWorkbook(
  prisma: PrismaService,
  clientId: string,
  buffer: Buffer,
): Promise<ParsedOpExportationImportRow[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as never);

  const sheet = wb.worksheets[0];
  if (!sheet) {
    throw new Error('Le classeur ne contient aucune feuille');
  }

  const colMap = buildExportationImportColumnMap(sheet.getRow(1));
  assertExportationImportHeadersComplete(colMap);

  const results: ParsedOpExportationImportRow[] = [];
  const lastRow = Math.min(sheet.rowCount || 1, MAX_IMPORT_ROWS + 1);
  const tierCache = new Map<string, ResolveTierForExportationResult>();
  const countryCache = new Map<string, string>();

  for (let r = 2; r <= lastRow; r++) {
    if (isRowEmpty(sheet, r, colMap)) {
      continue;
    }
    try {
      const year = parseYear(sheet, r, colMap.get('annee'));
      const month = parseMonth(sheet, r, colMap.get('mois'));
      const ninea = cellText(sheet, r, colMap.get('ninea'));
      const clientLabel = cellText(sheet, r, colMap.get('client'));
      const adresse = cellText(sheet, r, colMap.get('adresse'));
      const paysLabel = cellText(sheet, r, colMap.get('pays'));
      const code = cellText(sheet, r, colMap.get('numeroFacture'));
      const montant = cellNumber(sheet, r, colMap.get('montant'));

      if (!code) throw new Error('N° facture manquant');
      if (montant === undefined || montant < 0) throw new Error('Montant invalide');

      const paysKey = normalizeLabelForMatch(paysLabel);
      let countryId = countryCache.get(paysKey);
      if (!countryId) {
        countryId = await findCountryIdByName(prisma, paysLabel);
        countryCache.set(paysKey, countryId);
      }

      const { tierId, created, updated } = await resolveTierForExportationImport(
        prisma,
        clientId,
        clientLabel,
        ninea,
        adresse,
        tierCache,
      );

      results.push({
        rowNumber: r,
        dto: {
          tierId,
          countryId,
          code,
          month,
          year,
          date: monthDateIso(year, month),
          total: montant,
        },
        ...(created ? { tierCreated: true } : {}),
        ...(updated ? { tierUpdated: true } : {}),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push({ rowNumber: r, error: msg });
    }
  }

  return results;
}
