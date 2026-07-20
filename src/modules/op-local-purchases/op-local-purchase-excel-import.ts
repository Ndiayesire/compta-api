import ExcelJS from 'exceljs';
import { Prisma } from '@prisma/client';
import type { PrismaService } from '../../../prisma/prisma.service';
import { normalizeImportHeader } from '../employees/employee-excel-import';
import { normalizeLabelForMatch } from '../op-exportations/op-exportation-excel-import';
import { findOrCreateDeductionTypeByName, findOrCreatePropertyNatureTypeByName } from '../op-importations/op-importation-excel-import';
import type { CreateOpLocalPurchaseDto } from './dto/create-op-local-purchase.dto';

export type OpLocalPurchaseImportColumnKey =
  | 'annee'
  | 'mois'
  | 'ninea'
  | 'cofi'
  | 'fournisseur'
  | 'adresse'
  | 'typeDeduction'
  | 'natureBienService'
  | 'montantHt'
  | 'tva'
  | 'tvaDeductible'
  | 'ttc'
  | 'txProrata';

const HEADER_SYNONYMS: { key: OpLocalPurchaseImportColumnKey; patterns: string[] }[] = [
  { key: 'annee', patterns: ['annee', 'année', 'year'] },
  { key: 'mois', patterns: ['mois', 'month'] },
  { key: 'ninea', patterns: ['ninea'] },
  { key: 'cofi', patterns: ['cofi'] },
  { key: 'fournisseur', patterns: ['fournisseur', 'supplier'] },
  { key: 'adresse', patterns: ['adresse', 'address'] },
  {
    key: 'typeDeduction',
    patterns: ['type deduction', 'type de deduction', 'type déduction', 'deduction type'],
  },
  {
    key: 'natureBienService',
    patterns: [
      'nature du bien ou du service',
      'nature du bien ou service',
      'nature bien service',
      'nature du bien',
      'nature bien',
    ],
  },
  { key: 'montantHt', patterns: ['montant ht', 'montant'] },
  { key: 'tva', patterns: ['tva'] },
  {
    key: 'tvaDeductible',
    patterns: ['tva deduite', 'tva déduite', 'tva deductible', 'tva déductible', 'tva detuctible'],
  },
  { key: 'ttc', patterns: ['ttc', 'montant ttc', 'total'] },
  { key: 'txProrata', patterns: ['tx prorata', 'taux prorata', 'prorata'] },
];

const REQUIRED_KEYS: OpLocalPurchaseImportColumnKey[] = [
  'annee',
  'mois',
  'typeDeduction',
  'natureBienService',
  'montantHt',
  'tva',
  'tvaDeductible',
  'ttc',
];

const MAX_IMPORT_ROWS = 500;

function matchColumnKey(normalizedHeader: string): OpLocalPurchaseImportColumnKey | null {
  for (const { key, patterns } of HEADER_SYNONYMS) {
    for (const p of patterns) {
      if (normalizeImportHeader(p) === normalizedHeader) {
        return key;
      }
    }
  }
  return null;
}

export function buildLocalPurchaseImportColumnMap(
  headerRow: ExcelJS.Row,
): Map<OpLocalPurchaseImportColumnKey, number> {
  const map = new Map<OpLocalPurchaseImportColumnKey, number>();
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const key = matchColumnKey(normalizeImportHeader(cell.value));
    if (key && !map.has(key)) {
      map.set(key, colNumber);
    }
  });
  return map;
}

export function assertLocalPurchaseImportHeadersComplete(
  colMap: Map<OpLocalPurchaseImportColumnKey, number>,
): void {
  const missing = REQUIRED_KEYS.filter((k) => !colMap.has(k));
  if (missing.length > 0) {
    throw new Error(
      `Colonnes obligatoires manquantes dans la 1ʳᵉ ligne : ${missing.join(', ')}. Vérifier le modèle purchases-import-template.xlsx.`,
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

function eqAccentInsensitive(a: string, b: string): boolean {
  return normalizeLabelForMatch(a) === normalizeLabelForMatch(b);
}

function eqInsensitive(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
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

function slugReference(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toUpperCase()
    .slice(0, 200);
  return `ACH-${base || 'TIER'}`;
}

function mergeTierPurchaseMeta(
  adresse: string,
  cofi: string,
  existingMeta: unknown,
): Prisma.InputJsonValue {
  const base =
    typeof existingMeta === 'object' && existingMeta !== null && !Array.isArray(existingMeta)
      ? { ...(existingMeta as Record<string, Prisma.InputJsonValue>) }
      : {};
  const next = { ...base };
  if (adresse.trim()) {
    next.beneficiaryAddress = adresse.trim();
    next.address = adresse.trim();
  }
  if (cofi.trim()) {
    next.cofi = cofi.trim();
  }
  return next;
}

async function resolveSupplierTierTypeId(prisma: PrismaService): Promise<string> {
  const types = await prisma.tierType.findMany({
    where: { isActive: true },
    select: { id: true, code: true },
  });
  const supplier = types.find((t) => eqAccentInsensitive(t.code, 'SUPPLIER'));
  if (supplier) return supplier.id;
  if (types.length === 0) {
    throw new Error('Aucun type de tiers actif en base — impossible de créer un fournisseur importé');
  }
  return types[0].id;
}

export type ResolveSupplierTierForPurchaseResult = {
  tierId: string;
  created: boolean;
  updated: boolean;
};

/**
 * 1. Cherche le fournisseur par **NINEA** (pour le `clientId`).
 * 2. Sinon, par **nom** fournisseur (casse + accents).
 * 3. Si trouvé → met à jour NINEA, COFI (`meta.cofi`) et adresse si fournis.
 * 4. Sinon → crée un tiers type **SUPPLIER**.
 */
export async function resolveSupplierTierForPurchaseImport(
  prisma: PrismaService,
  clientId: string,
  fournisseur: string,
  ninea: string,
  cofi: string,
  adresse: string,
  cache: Map<string, ResolveSupplierTierForPurchaseResult>,
): Promise<ResolveSupplierTierForPurchaseResult> {
  const trimmedName = fournisseur.trim();
  const trimmedNinea = ninea.trim();
  const trimmedCofi = cofi.trim();
  if (!trimmedName && !trimmedNinea) {
    throw new Error('FOURNISSEUR ou NINEA requis');
  }

  const cacheKey = `${normalizeLabelForMatch(trimmedName)}|${normalizeLabelForMatch(trimmedNinea)}|${normalizeLabelForMatch(trimmedCofi)}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const tiers = await prisma.tier.findMany({
    where: { clientId, deletedAt: null },
    select: { id: true, name: true, ninea: true, meta: true },
  });

  const applyMetaUpdate = async (
    tier: { id: string; meta: unknown },
    updateNinea?: string,
  ): Promise<boolean> => {
    const data: { ninea?: string; meta?: Prisma.InputJsonValue } = {};
    if (updateNinea) {
      data.ninea = updateNinea;
    }
    const mergedMeta = mergeTierPurchaseMeta(adresse, trimmedCofi, tier.meta);
    const metaChanged =
      adresse.trim().length > 0 ||
      trimmedCofi.length > 0 ||
      JSON.stringify(mergedMeta) !== JSON.stringify(tier.meta ?? {});
    if (metaChanged) {
      data.meta = mergedMeta;
    }
    const shouldUpdate = Boolean(updateNinea) || metaChanged;
    if (shouldUpdate) {
      await prisma.tier.update({ where: { id: tier.id }, data });
    }
    return shouldUpdate;
  };

  if (trimmedNinea) {
    const byNinea = tiers.filter((t) => eqInsensitive(t.ninea, trimmedNinea));
    if (byNinea.length > 1) {
      throw new Error(`Plusieurs tiers avec le NINEA « ${trimmedNinea} » pour ce client`);
    }
    if (byNinea.length === 1) {
      const updated = await applyMetaUpdate(byNinea[0]);
      const result = { tierId: byNinea[0].id, created: false, updated };
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
      const updated = await applyMetaUpdate(byName[0], trimmedNinea || undefined);
      const result = { tierId: byName[0].id, created: false, updated };
      cache.set(cacheKey, result);
      return result;
    }
  }

  const tierTypeId = await resolveSupplierTierTypeId(prisma);
  const displayName = trimmedName || `Fournisseur ${trimmedNinea}`;
  const meta = {
    importedFromLocalPurchase: true,
    ...(trimmedCofi ? { cofi: trimmedCofi } : {}),
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

function parseProrata(sheet: ExcelJS.Worksheet, row: number, col: number | undefined): Record<string, unknown> {
  const rate = cellNumber(sheet, row, col);
  if (rate === undefined) {
    return { rate: 1 };
  }
  return { rate };
}

function isRowEmpty(
  sheet: ExcelJS.Worksheet,
  row: number,
  colMap: Map<OpLocalPurchaseImportColumnKey, number>,
): boolean {
  for (const col of colMap.values()) {
    if (cellText(sheet, row, col)) return false;
  }
  return true;
}

export type ParsedOpLocalPurchaseImportRow =
  | {
      rowNumber: number;
      dto: CreateOpLocalPurchaseDto;
      tierCreated?: boolean;
      tierUpdated?: boolean;
      deductionTypeCreated?: boolean;
      propertyNatureTypeCreated?: boolean;
    }
  | { rowNumber: number; error: string };

export async function parseOpLocalPurchaseImportWorkbook(
  prisma: PrismaService,
  clientId: string,
  buffer: Buffer,
): Promise<ParsedOpLocalPurchaseImportRow[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as never);

  const sheet = wb.worksheets[0];
  if (!sheet) {
    throw new Error('Le classeur ne contient aucune feuille');
  }

  const colMap = buildLocalPurchaseImportColumnMap(sheet.getRow(1));
  assertLocalPurchaseImportHeadersComplete(colMap);

  const results: ParsedOpLocalPurchaseImportRow[] = [];
  const lastRow = Math.min(sheet.rowCount || 1, MAX_IMPORT_ROWS + 1);
  const tierCache = new Map<string, ResolveSupplierTierForPurchaseResult>();
  const deductionCache = new Map<string, { deductionTypeId: string; created: boolean }>();
  const propertyNatureCache = new Map<string, { propertyNatureTypeId: string; created: boolean }>();

  for (let r = 2; r <= lastRow; r++) {
    if (isRowEmpty(sheet, r, colMap)) {
      continue;
    }
    try {
      const year = parseYear(sheet, r, colMap.get('annee'));
      const month = parseMonth(sheet, r, colMap.get('mois'));
      const ninea = cellText(sheet, r, colMap.get('ninea'));
      const cofi = cellText(sheet, r, colMap.get('cofi'));
      const fournisseur = cellText(sheet, r, colMap.get('fournisseur'));
      const adresse = cellText(sheet, r, colMap.get('adresse'));
      const typeDeduction = cellText(sheet, r, colMap.get('typeDeduction'));
      const natureBien = cellText(sheet, r, colMap.get('natureBienService'));
      const net          = parseRequiredAmount(sheet, r, colMap.get('montantHt'), 'MONTANT HT');
      const tax          = parseRequiredAmount(sheet, r, colMap.get('tva'), 'TVA');
      const taxDeduction = parseRequiredAmount(sheet, r, colMap.get('tvaDeductible'), 'TVA DEDUITE');
      if (taxDeduction > tax + 0.01) {
        throw new Error(`TVA déductible (${taxDeduction}) supérieure à la TVA (${tax})`);
      }
      const computedTotal = Math.round((net + tax) * 100) / 100;
      const totalFromCol  = cellNumber(sheet, r, colMap.get('ttc'));
      // Utiliser TTC si cohérent avec net+tax (tolérance ±1 FCFA). Sinon recalculer.
      const total =
        totalFromCol !== undefined && totalFromCol >= 0 && Math.abs(totalFromCol - computedTotal) <= 1
          ? totalFromCol
          : computedTotal;
      const prorata = parseProrata(sheet, r, colMap.get('txProrata'));

      const tierResolved = await resolveSupplierTierForPurchaseImport(
        prisma,
        clientId,
        fournisseur,
        ninea,
        cofi,
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

      const dto: CreateOpLocalPurchaseDto = {
        tierId: tierResolved.tierId,
        deductionTypeId: deductionResolved.deductionTypeId,
        propertyNatureTypeId: propertyNatureResolved.propertyNatureTypeId,
        month,
        year,
        net,
        tax,
        taxDeduction,
        total,
        prorata,
      };

      results.push({
        rowNumber: r,
        dto,
        ...(tierResolved.created ? { tierCreated: true } : {}),
        ...(tierResolved.updated ? { tierUpdated: true } : {}),
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
