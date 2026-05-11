import ExcelJS from 'exceljs';
import type { PrismaService } from '../../../prisma/prisma.service';
import type { CreateEmployeeDto } from './dto/create-employee.dto';

export type EmployeeImportColumnKey =
  | 'typeContrat'
  | 'typeIdentification'
  | 'prenom'
  | 'nom'
  | 'poste'
  | 'email'
  | 'telephone'
  | 'adresse'
  | 'numeroAssuranceSociale'
  | 'numeroPiece'
  | 'salaire'
  | 'cadre'
  | 'dateDebut'
  | 'dateFin';

/** En-têtes reconnus (après normalisation) → clé logique. */
const HEADER_SYNONYMS: { key: EmployeeImportColumnKey; patterns: string[] }[] = [
  { key: 'typeContrat', patterns: ['type de contrat'] },
  { key: 'typeIdentification', patterns: ["type d'identification", 'type d identification'] },
  { key: 'prenom', patterns: ['prenom', 'prénom'] },
  { key: 'nom', patterns: ['nom'] },
  { key: 'poste', patterns: ['poste'] },
  { key: 'email', patterns: ['email', 'e-mail'] },
  { key: 'telephone', patterns: ['telephone', 'téléphone'] },
  { key: 'adresse', patterns: ['adresse'] },
  {
    key: 'numeroAssuranceSociale',
    patterns: [
      "numero d'identification social",
      "numéro d'identification social",
      'numero identification social',
      'numéro identification social',
    ],
  },
  {
    key: 'numeroPiece',
    patterns: ["numero d'identification", "numéro d'identification", 'numero identification', 'numéro identification'],
  },
  { key: 'salaire', patterns: ['salaire'] },
  { key: 'cadre', patterns: ['cadre'] },
  { key: 'dateDebut', patterns: ['date de debut', 'date de début'] },
  { key: 'dateFin', patterns: ['date de fin'] },
];

const REQUIRED_KEYS: EmployeeImportColumnKey[] = [
  'typeContrat',
  'prenom',
  'nom',
  'poste',
  'email',
  'telephone',
  'adresse',
  'dateDebut',
  'dateFin',
];

export function normalizeImportHeader(value: unknown): string {
  const raw = String(value ?? '')
    .replace(/\u00A0/g, ' ')
    .trim();
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function matchColumnKey(normalizedHeader: string): EmployeeImportColumnKey | null {
  for (const { key, patterns } of HEADER_SYNONYMS) {
    for (const p of patterns) {
      if (normalizeImportHeader(p) === normalizedHeader) {
        return key;
      }
    }
  }
  return null;
}

/** Première ligne : libellés → index de colonne (1-based). */
export function buildImportColumnMap(headerRow: ExcelJS.Row): Map<EmployeeImportColumnKey, number> {
  const map = new Map<EmployeeImportColumnKey, number>();
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const key = matchColumnKey(normalizeImportHeader(cell.value));
    if (key && !map.has(key)) {
      map.set(key, colNumber);
    }
  });
  return map;
}

export function assertImportHeadersComplete(colMap: Map<EmployeeImportColumnKey, number>): void {
  const missing = REQUIRED_KEYS.filter((k) => !colMap.has(k));
  if (missing.length > 0) {
    throw new Error(
      `Colonnes obligatoires manquantes dans la 1ʳᵉ ligne : ${missing.join(', ')}. Vérifier les intitulés (voir modèle).`,
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

/** Interprète une date Excel (nombre, Date, ou chaîne ISO / locale). */
function cellDateIso(sheet: ExcelJS.Worksheet, row: number, col: number | undefined): string | null {
  if (col === undefined) return null;
  const cell = sheet.getCell(row, col);
  const v = cell.value;
  if (v == null || v === '') return null;
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return v.toISOString();
  }
  if (typeof v === 'number' && !Number.isNaN(v)) {
    const epoch = Date.UTC(1899, 11, 30);
    const ms = epoch + Math.round(v * 86400000);
    const d = new Date(ms);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  const t = cellText(sheet, row, col);
  if (!t) return null;
  const d = new Date(t);
  if (!Number.isNaN(d.getTime())) return d.toISOString();
  return null;
}

function parseCadre(sheet: ExcelJS.Worksheet, row: number, col: number | undefined): boolean {
  const t = cellText(sheet, row, col).toLowerCase();
  if (!t) return false;
  if (['1', 'true', 'oui', 'yes', 'v', 'x'].includes(t)) return true;
  return false;
}

function eqNameInsensitive(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

async function resolveContractTypeIdByName(prisma: PrismaService, name: string): Promise<string> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Type de contrat vide');
  }
  const rows = await prisma.contractType.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });
  const matches = rows.filter((r) => eqNameInsensitive(r.name, trimmed));
  if (matches.length === 0) {
    throw new Error(`Type de contrat inconnu : « ${trimmed} »`);
  }
  if (matches.length > 1) {
    throw new Error(`Plusieurs types de contrat « ${trimmed} »`);
  }
  return matches[0].id;
}

async function resolveIdentificationTypeIdByName(
  prisma: PrismaService,
  name: string,
): Promise<string | undefined> {
  const trimmed = name.trim();
  if (!trimmed) {
    return undefined;
  }
  const rows = await prisma.identificationType.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });
  const matches = rows.filter((r) => eqNameInsensitive(r.name, trimmed));
  if (matches.length === 0) {
    throw new Error(`Type d'identification inconnu : « ${trimmed} »`);
  }
  if (matches.length > 1) {
    throw new Error(`Plusieurs types d'identification « ${trimmed} »`);
  }
  return matches[0].id;
}

function isRowEmpty(sheet: ExcelJS.Worksheet, row: number, colMap: Map<EmployeeImportColumnKey, number>): boolean {
  for (const col of colMap.values()) {
    if (cellText(sheet, row, col)) return false;
  }
  return true;
}

export type ParsedEmployeeImportRow =
  | { rowNumber: number; dto: CreateEmployeeDto }
  | { rowNumber: number; error: string };

const MAX_IMPORT_ROWS = 500;

/**
 * @param clientId Client cible (déjà validé société + JWT côté service).
 */
export async function parseEmployeeImportWorkbook(
  prisma: PrismaService,
  clientId: string,
  buffer: Buffer,
): Promise<ParsedEmployeeImportRow[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as never);

  const sheet = wb.worksheets[0];
  if (!sheet) {
    throw new Error('Le classeur ne contient aucune feuille');
  }

  const headerRow = sheet.getRow(1);
  const colMap = buildImportColumnMap(headerRow);
  assertImportHeadersComplete(colMap);

  const results: ParsedEmployeeImportRow[] = [];
  const lastRow = Math.min(sheet.rowCount || 1, MAX_IMPORT_ROWS + 1);

  for (let r = 2; r <= lastRow; r++) {
    if (isRowEmpty(sheet, r, colMap)) {
      continue;
    }
    try {
      const typeContrat = cellText(sheet, r, colMap.get('typeContrat'));
      const typeIdentification = cellText(sheet, r, colMap.get('typeIdentification'));
      const prenom = cellText(sheet, r, colMap.get('prenom'));
      const nom = cellText(sheet, r, colMap.get('nom'));
      const poste = cellText(sheet, r, colMap.get('poste'));
      const email = cellText(sheet, r, colMap.get('email'));
      const telephone = cellText(sheet, r, colMap.get('telephone'));
      const adresse = cellText(sheet, r, colMap.get('adresse'));
      const nas = cellText(sheet, r, colMap.get('numeroAssuranceSociale'));
      const numeroPiece = cellText(sheet, r, colMap.get('numeroPiece'));
      const salaire = cellNumber(sheet, r, colMap.get('salaire'));
      const cadre = parseCadre(sheet, r, colMap.get('cadre'));
      const startIso = cellDateIso(sheet, r, colMap.get('dateDebut'));
      const endIso = cellDateIso(sheet, r, colMap.get('dateFin'));

      if (!prenom || !nom || !poste || !email || !telephone || !adresse) {
        throw new Error('Champs personne incomplets (prénom, nom, poste, email, téléphone, adresse)');
      }
      if (!startIso || !endIso) {
        throw new Error('Dates de début / fin invalides ou manquantes');
      }

      const contractTypeId = await resolveContractTypeIdByName(prisma, typeContrat);
      const identificationTypeId = typeIdentification
        ? await resolveIdentificationTypeIdByName(prisma, typeIdentification)
        : undefined;

      const dto: CreateEmployeeDto = {
        clientId,
        contractTypeId,
        ...(identificationTypeId ? { identificationTypeId } : {}),
        firstName: prenom,
        lastName: nom,
        jobTitle: poste,
        email,
        phone: telephone,
        address: adresse,
        ...(nas ? { socialInsuranceNumber: nas } : {}),
        ...(numeroPiece ? { identityNumber: numeroPiece } : {}),
        ...(salaire !== undefined ? { salary: salaire } : {}),
        isManager: cadre,
        startDate: startIso,
        endDate: endIso,
      };

      results.push({ rowNumber: r, dto });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push({ rowNumber: r, error: msg });
    }
  }

  return results;
}
