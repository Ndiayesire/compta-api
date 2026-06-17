import ExcelJS from 'exceljs';
import type { PrismaService } from '../../../prisma/prisma.service';
import { normalizeImportHeader } from '../employees/employee-excel-import';
import {
  findOrCreateCountryIdByName,
  normalizeLabelForMatch,
  type ResolveCountryResult,
} from '../op-exportations/op-exportation-excel-import';
import type { CreateOpImportationDto } from './dto/create-op-importation.dto';

export type OpImportationImportColumnKey =
  | 'annee'
  | 'mois'
  | 'fournisseur'
  | 'pays'
  | 'adresse'
  | 'typeDeduction'
  | 'natureBienService'
  | 'numeroDeclaration'
  | 'date'
  | 'montantHt'
  | 'tva'
  | 'tvaDeductible'
  | 'prorata';

const HEADER_SYNONYMS: { key: OpImportationImportColumnKey; patterns: string[] }[] = [
  { key: 'annee', patterns: ['annee', 'année', 'year'] },
  { key: 'mois', patterns: ['mois', 'month'] },
  { key: 'fournisseur', patterns: ['fournisseur', 'supplier'] },
  { key: 'pays', patterns: ['pays', 'country'] },
  { key: 'adresse', patterns: ['adresse', 'address'] },
  {
    key: 'typeDeduction',
    patterns: ['type deduction', 'type de deduction', 'type déduction', 'deduction type'],
  },
  {
    key: 'natureBienService',
    patterns: [
      'nature du bien ou du service',
      'nature bien service',
      'nature du bien',
      'nature bien',
    ],
  },
  {
    key: 'numeroDeclaration',
    patterns: [
      'n° declaration',
      'n°declaration',
      'n declaration',
      'numero declaration',
      'numéro declaration',
      'no declaration',
    ],
  },
  { key: 'date', patterns: ['date'] },
  { key: 'montantHt', patterns: ['montant ht', 'montant'] },
  { key: 'tva', patterns: ['tva'] },
  {
    key: 'tvaDeductible',
    patterns: ['tva deductible', 'tva detuctible'],
  },
  { key: 'prorata', patterns: ['prorata'] },
];

const REQUIRED_KEYS: OpImportationImportColumnKey[] = [
  'annee',
  'mois',
  'fournisseur',
  'pays',
  'typeDeduction',
  'natureBienService',
  'numeroDeclaration',
  'date',
];

const MAX_IMPORT_ROWS = 500;

function matchColumnKey(normalizedHeader: string): OpImportationImportColumnKey | null {
  for (const { key, patterns } of HEADER_SYNONYMS) {
    for (const p of patterns) {
      if (normalizeImportHeader(p) === normalizedHeader) {
        return key;
      }
    }
  }
  return null;
}

export function buildImportationImportColumnMap(
  headerRow: ExcelJS.Row,
): Map<OpImportationImportColumnKey, number> {
  const map = new Map<OpImportationImportColumnKey, number>();
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const key = matchColumnKey(normalizeImportHeader(cell.value));
    if (key && !map.has(key)) {
      map.set(key, colNumber);
    }
  });
  return map;
}

export function assertImportationImportHeadersComplete(
  colMap: Map<OpImportationImportColumnKey, number>,
): void {
  const missing = REQUIRED_KEYS.filter((k) => !colMap.has(k));
  if (missing.length > 0) {
    throw new Error(
      `Colonnes obligatoires manquantes dans la 1ʳᵉ ligne : ${missing.join(', ')}. Vérifier le modèle importations-import-template.xlsx.`,
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

function eqAccentInsensitive(a: string, b: string): boolean {
  return normalizeLabelForMatch(a) === normalizeLabelForMatch(b);
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

function slugReference(name: string, prefix: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toUpperCase()
    .slice(0, 200);
  return `${prefix}-${base || 'TIER'}`;
}

/** Abréviation du nom pour `deduction_type_code`. */
export function inferDeductionTypeCode(name: string): string {
  const words = normalizeLabelForMatch(name)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (words.length >= 2) {
    return words
      .map((w) => w.slice(0, 4))
      .join('-')
      .toUpperCase()
      .slice(0, 32);
  }
  if (words.length === 1) {
    return words[0].slice(0, 12).toUpperCase();
  }
  return 'DED';
}

async function pickUniqueDeductionTypeCode(prisma: PrismaService, base: string): Promise<string> {
  let candidate = base.slice(0, 32) || 'DED';
  for (let i = 0; i < 100; i++) {
    const suffix = i === 0 ? '' : `-${i}`;
    const code = `${candidate.slice(0, 32 - suffix.length)}${suffix}`;
    const existing = await prisma.deductionType.findFirst({
      where: { code, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return code;
  }
  throw new Error(`Impossible de générer un code type déduction unique pour « ${base} »`);
}

async function nextPropertyNatureTypeCode(prisma: PrismaService): Promise<string> {
  const rows = await prisma.propertyNatureType.findMany({
    where: { deletedAt: null },
    select: { code: true },
  });
  let max = 0;
  for (const row of rows) {
    const n = Number.parseInt(row.code, 10);
    if (Number.isFinite(n) && n > max) {
      max = n;
    }
  }
  return String(max + 1);
}

export type ResolveSupplierTierResult = { tierId: string; created: boolean };
export type ResolveDeductionTypeResult = { deductionTypeId: string; created: boolean };
export type ResolvePropertyNatureTypeResult = { propertyNatureTypeId: string; created: boolean };

export async function resolveSupplierTierForImport(
  prisma: PrismaService,
  clientId: string,
  supplierName: string,
  adresse: string,
  cache: Map<string, ResolveSupplierTierResult>,
): Promise<ResolveSupplierTierResult> {
  const trimmed = supplierName.trim();
  if (!trimmed) {
    throw new Error('Fournisseur vide');
  }

  const cacheKey = normalizeLabelForMatch(trimmed);
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const tiers = await prisma.tier.findMany({
    where: { clientId, deletedAt: null },
    select: { id: true, name: true },
  });
  const matches = tiers.filter((t) => eqAccentInsensitive(t.name, trimmed));
  if (matches.length > 1) {
    throw new Error(`Plusieurs tiers nommés « ${trimmed} » pour ce client`);
  }
  if (matches.length === 1) {
    const result = { tierId: matches[0].id, created: false };
    cache.set(cacheKey, result);
    return result;
  }

  const supplierTypes = await prisma.tierType.findMany({
    where: { isActive: true },
    select: { id: true, code: true },
  });
  const supplierType = supplierTypes.find((t) => eqAccentInsensitive(t.code, 'SUPPLIER'));
  if (!supplierType) {
    throw new Error('Type de tiers SUPPLIER introuvable en base');
  }

  const meta = {
    importedFromImportation: true,
    ...(adresse.trim()
      ? { beneficiaryAddress: adresse.trim(), address: adresse.trim() }
      : {}),
  };

  const created = await prisma.tier.create({
    data: {
      clientId,
      tierTypeId: supplierType.id,
      name: trimmed,
      ninea: 'NA',
      reference: slugReference(trimmed, 'IMP'),
      useTva: true,
      meta,
      isActive: true,
    },
    select: { id: true },
  });
  const result = { tierId: created.id, created: true };
  cache.set(cacheKey, result);
  return result;
}

export async function findOrCreateDeductionTypeByName(
  prisma: PrismaService,
  name: string,
  cache: Map<string, ResolveDeductionTypeResult>,
): Promise<ResolveDeductionTypeResult> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Type de déduction vide');
  }

  const cacheKey = normalizeLabelForMatch(trimmed);
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const rows = await prisma.deductionType.findMany({
    where: { deletedAt: null, isActive: true },
    select: { id: true, name: true, code: true },
  });
  const matches = rows.filter((r) => eqAccentInsensitive(r.name, trimmed));
  if (matches.length > 1) {
    throw new Error(`Plusieurs types de déduction nommés « ${trimmed} »`);
  }
  if (matches.length === 1) {
    const result = { deductionTypeId: matches[0].id, created: false };
    cache.set(cacheKey, result);
    return result;
  }

  const code = await pickUniqueDeductionTypeCode(prisma, inferDeductionTypeCode(trimmed));
  const created = await prisma.deductionType.create({
    data: { name: trimmed, code, isActive: true },
    select: { id: true },
  });
  const result = { deductionTypeId: created.id, created: true };
  cache.set(cacheKey, result);
  return result;
}

export async function findOrCreatePropertyNatureTypeByName(
  prisma: PrismaService,
  name: string,
  cache: Map<string, ResolvePropertyNatureTypeResult>,
): Promise<ResolvePropertyNatureTypeResult> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Nature du bien ou du service vide');
  }

  const cacheKey = normalizeLabelForMatch(trimmed);
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const rows = await prisma.propertyNatureType.findMany({
    where: { deletedAt: null, isActive: true },
    select: { id: true, name: true, code: true },
  });
  const matches = rows.filter((r) => eqAccentInsensitive(r.name, trimmed));
  if (matches.length > 1) {
    throw new Error(`Plusieurs natures de bien nommées « ${trimmed} »`);
  }
  if (matches.length === 1) {
    const result = { propertyNatureTypeId: matches[0].id, created: false };
    cache.set(cacheKey, result);
    return result;
  }

  const code = await nextPropertyNatureTypeCode(prisma);
  const created = await prisma.propertyNatureType.create({
    data: { name: trimmed, code, isActive: true },
    select: { id: true },
  });
  const result = { propertyNatureTypeId: created.id, created: true };
  cache.set(cacheKey, result);
  return result;
}

function isRowEmpty(
  sheet: ExcelJS.Worksheet,
  row: number,
  colMap: Map<OpImportationImportColumnKey, number>,
): boolean {
  for (const col of colMap.values()) {
    if (cellText(sheet, row, col)) return false;
  }
  return true;
}

export type ParsedOpImportationImportRow =
  | {
      rowNumber: number;
      dto: CreateOpImportationDto;
      tierCreated?: boolean;
      countryCreated?: boolean;
      deductionTypeCreated?: boolean;
      propertyNatureTypeCreated?: boolean;
    }
  | { rowNumber: number; error: string };

export async function parseOpImportationImportWorkbook(
  prisma: PrismaService,
  clientId: string,
  buffer: Buffer,
): Promise<ParsedOpImportationImportRow[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as never);

  const sheet = wb.worksheets[0];
  if (!sheet) {
    throw new Error('Le classeur ne contient aucune feuille');
  }

  const colMap = buildImportationImportColumnMap(sheet.getRow(1));
  assertImportationImportHeadersComplete(colMap);

  const results: ParsedOpImportationImportRow[] = [];
  const lastRow = Math.min(sheet.rowCount || 1, MAX_IMPORT_ROWS + 1);
  const tierCache = new Map<string, ResolveSupplierTierResult>();
  const countryCache = new Map<string, ResolveCountryResult>();
  const deductionCache = new Map<string, ResolveDeductionTypeResult>();
  const propertyNatureCache = new Map<string, ResolvePropertyNatureTypeResult>();

  for (let r = 2; r <= lastRow; r++) {
    if (isRowEmpty(sheet, r, colMap)) {
      continue;
    }
    try {
      const year = parseYear(sheet, r, colMap.get('annee'));
      const month = parseMonth(sheet, r, colMap.get('mois'));
      const fournisseur = cellText(sheet, r, colMap.get('fournisseur'));
      const paysLabel = cellText(sheet, r, colMap.get('pays'));
      const adresse = cellText(sheet, r, colMap.get('adresse'));
      const typeDeduction = cellText(sheet, r, colMap.get('typeDeduction'));
      const natureBien = cellText(sheet, r, colMap.get('natureBienService'));
      const code = cellText(sheet, r, colMap.get('numeroDeclaration'));
      const date = parseImportDate(sheet, r, colMap.get('date'));
      const net = cellNumber(sheet, r, colMap.get('montantHt'));
      const tax = cellNumber(sheet, r, colMap.get('tva'));
      const taxDeduction = cellNumber(sheet, r, colMap.get('tvaDeductible'));
      const prorata = cellNumber(sheet, r, colMap.get('prorata'));

      if (!code) throw new Error('N° déclaration manquant');

      const paysKey = normalizeLabelForMatch(paysLabel);
      let countryResolved = countryCache.get(paysKey);
      if (!countryResolved) {
        countryResolved = await findOrCreateCountryIdByName(prisma, paysLabel, countryCache);
      }

      const tierResolved = await resolveSupplierTierForImport(
        prisma,
        clientId,
        fournisseur,
        adresse,
        tierCache,
      );

      const deductionResolved = await findOrCreateDeductionTypeByName(
        prisma,
        typeDeduction,
        deductionCache,
      );

      const propertyNatureResolved = await findOrCreatePropertyNatureTypeByName(
        prisma,
        natureBien,
        propertyNatureCache,
      );

      const dto: CreateOpImportationDto = {
        tierId: tierResolved.tierId,
        countryId: countryResolved.countryId,
        deductionTypeId: deductionResolved.deductionTypeId,
        propertyNatureTypeId: propertyNatureResolved.propertyNatureTypeId,
        code,
        month,
        year,
        date,
      };
      if (net !== undefined) dto.net = net;
      if (tax !== undefined) dto.tax = tax;
      if (taxDeduction !== undefined) dto.taxDeduction = taxDeduction;
      if (prorata !== undefined) dto.prorata = prorata;
      if (net !== undefined && tax !== undefined) {
        dto.total = net + tax - (taxDeduction ?? 0);
      }

      results.push({
        rowNumber: r,
        dto,
        ...(tierResolved.created ? { tierCreated: true } : {}),
        ...(countryResolved.created ? { countryCreated: true } : {}),
        ...(deductionResolved.created ? { deductionTypeCreated: true } : {}),
        ...(propertyNatureResolved.created ? { propertyNatureTypeCreated: true } : {}),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push({ rowNumber: r, error: msg });
    }
  }

  return results;
}
