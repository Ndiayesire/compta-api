import ExcelJS from 'exceljs';
import { normalizeImportHeader } from '../employees/employee-excel-import';

export type BalanceLineImportColumnKey =
  | 'number'
  | 'name'
  | 'previousDebit'
  | 'previousCredit'
  | 'debit'
  | 'credit'
  | 'currentDebit'
  | 'currentCredit';

/**
 * En-têtes reconnus (1ʳᵉ ligne). Modèle type balance auxiliaire :
 * paires **Débit N-1 / Crédit N-1** et **Débit N / Crédit N** → solde net + sens en base.
 * Les libellés **français complets** sont prioritaires ; abréviations (cpte, MVT DEB, …) restent acceptées.
 * Les **infobulles** (notes Excel sur la ligne d’en-tête) du fichier modèle ne sont pas des colonnes importées.
 *
 * Montants : espaces retirés (milliers), virgule décimale normalisée en point ; `balanceId` hors fichier (URL uniquement).
 */
const HEADER_SYNONYMS: { key: BalanceLineImportColumnKey; patterns: string[] }[] = [
  {
    key: 'number',
    patterns: [
      'numero de compte',
      'n° compte',
      'n compte',
      'compte',
      'cpte',
      'cpte:',
      'code compte',
      'balance_line_number',
    ],
  },
  {
    key: 'name',
    patterns: [
      'libelle',
      'libellé',
      'intitule',
      'intitulé',
      'nom du compte',
      'balance_line_name',
    ],
  },
  {
    key: 'previousDebit',
    patterns: [
      'débit n-1',
      'débit n 1',
      'debit n-1',
      'debit n 1',
      'deb n-1',
      'deb n 1',
      'debn-1',
      'balance_line_previous_debit',
    ],
  },
  {
    key: 'previousCredit',
    patterns: [
      'crédit n-1',
      'crédit n 1',
      'credit n-1',
      'credit n 1',
      'cred n-1',
      'cred n 1',
      'credn-1',
      'balance_line_previous_credit',
    ],
  },
  {
    key: 'debit',
    patterns: [
      'mouvement débit',
      'mouvement debit',
      'mouvements débit',
      'mouvements debit',
      'mvt débit',
      'mvt debit',
      'mvt deb',
      'mouvement deb',
      'balance_line_debit',
    ],
  },
  {
    key: 'credit',
    patterns: [
      'mouvement crédit',
      'mouvement credit',
      'mouvements crédit',
      'mouvements credit',
      'mvt crédit',
      'mvt credit',
      'mvt cred',
      'mouvement cred',
      'balance_line_credit',
    ],
  },
  {
    key: 'currentDebit',
    patterns: [
      'débit n',
      'debit n',
      'deb n',
      'balance_line_current_debit',
    ],
  },
  {
    key: 'currentCredit',
    patterns: [
      'crédit n',
      'credit n',
      'cred n',
      'balance_line_current_credit',
    ],
  },
];

const REQUIRED_KEYS: BalanceLineImportColumnKey[] = [
  'number',
  'name',
  'previousDebit',
  'previousCredit',
  'debit',
  'credit',
  'currentDebit',
  'currentCredit',
];

function matchColumnKey(normalizedHeader: string): BalanceLineImportColumnKey | null {
  for (const { key, patterns } of HEADER_SYNONYMS) {
    for (const p of patterns) {
      if (normalizeImportHeader(p) === normalizedHeader) {
        return key;
      }
    }
  }
  return null;
}

function buildColumnMap(headerRow: ExcelJS.Row): Map<BalanceLineImportColumnKey, number> {
  const map = new Map<BalanceLineImportColumnKey, number>();
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const key = matchColumnKey(normalizeImportHeader(cell.value));
    if (key && !map.has(key)) {
      map.set(key, colNumber);
    }
  });
  return map;
}

function assertHeadersComplete(colMap: Map<BalanceLineImportColumnKey, number>): void {
  const missing = REQUIRED_KEYS.filter((k) => !colMap.has(k));
  if (missing.length > 0) {
    throw new Error(
      `Colonnes manquantes : ${missing.join(', ')}. Le fichier doit comporter **8 colonnes** (ordre libre), par exemple : **Numéro de compte**, **Libellé**, **Débit N-1**, **Crédit N-1**, **Mouvement débit**, **Mouvement crédit**, **Débit N**, **Crédit N** (abréviations type « cpte », « MVT DEB » encore acceptées).`,
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
  if (typeof v === 'object' && v !== null && 'result' in v) {
    const r = (v as ExcelJS.CellFormulaValue).result;
    return r == null ? '' : String(r).trim();
  }
  return String(v).trim();
}

function cellNumber(sheet: ExcelJS.Worksheet, row: number, col: number | undefined): number {
  if (col === undefined) return 0;
  const cell = sheet.getCell(row, col);
  const v = cell.value;
  if (v == null || v === '') return 0;
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  const t = cellText(sheet, row, col).replace(/\s/g, '').replace(',', '.');
  if (!t) return 0;
  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
}

/** À partir des colonnes débit / crédit d’un même exercice : solde net + sens débiteur. */
function netFromDebitCredit(debit: number, credit: number): {
  sold: number;
  isDebit: boolean;
} {
  const d = debit;
  const c = credit;
  if (d === c) {
    return { sold: 0, isDebit: false };
  }
  if (d > c) {
    return { sold: d - c, isDebit: true };
  }
  return { sold: c - d, isDebit: false };
}

function isRowEmpty(
  sheet: ExcelJS.Worksheet,
  row: number,
  colMap: Map<BalanceLineImportColumnKey, number>,
): boolean {
  for (const key of REQUIRED_KEYS) {
    const col = colMap.get(key);
    if (key === 'number' || key === 'name') {
      if (cellText(sheet, row, col)) return false;
      continue;
    }
    if (cellNumber(sheet, row, col) !== 0) return false;
  }
  return true;
}

export type ParsedBalanceLineImportRow =
  | { rowNumber: number; error: string }
  | {
      rowNumber: number;
      number: string;
      name: string;
      previousSold: number;
      previousIsDebit: boolean;
      debit: number;
      credit: number;
      currentSold: number;
      currentIsDebit: boolean;
    };

const MAX_IMPORT_ROWS = 500;

/**
 * 1ʳᵉ feuille : ligne 1 = **8 en-têtes** (ordre libre). Pas de `balance_id` (UUID dans l’URL).
 */
export async function parseBalanceLineImportWorkbook(
  buffer: Buffer,
): Promise<ParsedBalanceLineImportRow[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as never);
  const sheet = wb.worksheets[0];
  if (!sheet) {
    throw new Error('Le classeur ne contient aucune feuille.');
  }

  const headerRow = sheet.getRow(1);
  const colMap = buildColumnMap(headerRow);
  assertHeadersComplete(colMap);

  const out: ParsedBalanceLineImportRow[] = [];
  let used = 0;
  const lastRow = sheet.rowCount || 1;

  for (let r = 2; r <= lastRow; r++) {
    if (used >= MAX_IMPORT_ROWS) {
      break;
    }
    if (isRowEmpty(sheet, r, colMap)) {
      continue;
    }
    used++;

    const num = cellText(sheet, r, colMap.get('number'));
    const name = cellText(sheet, r, colMap.get('name'));
    if (!num) {
      out.push({ rowNumber: r, error: 'Numéro de compte vide' });
      continue;
    }
    if (!name) {
      out.push({ rowNumber: r, error: 'Libellé vide' });
      continue;
    }

    const pDeb = cellNumber(sheet, r, colMap.get('previousDebit'));
    const pCred = cellNumber(sheet, r, colMap.get('previousCredit'));
    const { sold: previousSold, isDebit: previousIsDebit } = netFromDebitCredit(pDeb, pCred);

    const debit = cellNumber(sheet, r, colMap.get('debit'));
    const credit = cellNumber(sheet, r, colMap.get('credit'));

    const cDeb = cellNumber(sheet, r, colMap.get('currentDebit'));
    const cCred = cellNumber(sheet, r, colMap.get('currentCredit'));
    const { sold: currentSold, isDebit: currentIsDebit } = netFromDebitCredit(cDeb, cCred);

    out.push({
      rowNumber: r,
      number: num.slice(0, 255),
      name: name.slice(0, 255),
      previousSold,
      previousIsDebit,
      debit,
      credit,
      currentSold,
      currentIsDebit,
    });
  }

  return out;
}
