import { Injectable, InternalServerErrorException } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { resolveBundledAsset } from '../../../common/utils/resolve-bundled-asset.util';
import { clearWorkbookDefinedNamesBeforeSave } from '../utils/workbook-defined-names.util';
import type { EtatTrimestrielSommesVerseesFormData } from '../types/etat-trimestriel-sommes-versees.types';

const TEMPLATE_FILENAME = 'etat-trimestriel-sommes-versees.xlsx' as const;

const TEMPLATE_PAGE_MARGINS = {
  left: 0.7,
  right: 0.7,
  top: 0.75,
  bottom: 0.75,
  header: 0.3,
  footer: 0.3,
} as const;

const PAPER_A4 = 9;
const TEMPLATE_PRINT_AREA = 'A1:V228';

function applyTemplatePrintLayout(sheet: ExcelJS.Worksheet): void {
  sheet.pageSetup.margins = { ...TEMPLATE_PAGE_MARGINS };
  sheet.pageSetup.paperSize = PAPER_A4;
  sheet.pageSetup.orientation = 'portrait';
  sheet.pageSetup.printArea = TEMPLATE_PRINT_AREA;
  sheet.pageSetup.fitToPage = true;
  sheet.pageSetup.fitToWidth = 1;
  sheet.pageSetup.fitToHeight = 0;
  sheet.pageSetup.horizontalCentered = false;
  sheet.pageSetup.verticalCentered = false;
  sheet.pageSetup.scale = undefined;
}

/** N’écrit que si la valeur est non vide — ne vide aucune cellule du modèle. */
function setText(sheet: ExcelJS.Worksheet, address: string, value: string): void {
  const v = (value ?? '').trim();
  if (v.length === 0) return;
  sheet.getCell(address).value = v;
}

/**
 * Ex. libellé DGID : « Premier Trimestre 2025 » → H9 Premier · IJ9 Trimestre · KLMN9 2025.
 * Normalise les espaces (ex. NBSP \u00A0) pour éviter un seul token et donc toute la phrase en case 1.
 */
function splitQuarterNameIntoThreeParts(value: string): [string, string, string] {
  const raw = (value ?? '').trim();
  if (raw.length === 0) {
    return ['', '', ''];
  }

  const normalized = raw
    .replace(/\u00A0/g, ' ')
    .replace(/[\u2000-\u200B\u202F\u205F\u3000]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const dgid = normalized.match(
    /^(Premier|Deuxième|Troisième|Quatrième)\s+Trimestre\s+(\d{4})$/i,
  );
  if (dgid) {
    const ord =
      dgid[1].charAt(0).toUpperCase() + dgid[1].slice(1).toLowerCase();
    return [ord, 'Trimestre', dgid[2]];
  }

  const parts = normalized.split(' ').filter((p) => p.length > 0);

  if (parts.length === 0) {
    return ['', '', ''];
  }
  if (parts.length === 1) {
    return [parts[0], '', ''];
  }
  if (parts.length === 2) {
    return [parts[0], parts[1], ''];
  }
  return [parts[0], parts[1], parts.slice(2).join(' ')];
}

/**
 * Génère le classeur « État trimestriel des sommes versées » à partir du modèle Excel.
 * Styles, fusions et mise en forme du template sont conservés.
 */
@Injectable()
export class EtatTrimestrielSommesVerseesExcelService {
  async fillWorkbook(data: EtatTrimestrielSommesVerseesFormData): Promise<Buffer> {
    try {
      const templatePath = resolveBundledAsset(`xlsx/${TEMPLATE_FILENAME}`);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(templatePath);

      const sheet = workbook.getWorksheet(1) ?? workbook.worksheets[0];
      if (!sheet) {
        throw new Error('Aucune feuille dans le modèle');
      }

      applyTemplatePrintLayout(sheet);

      const d = data.declarant;

      /** Année de référence : fusion R1–U1 (valeur maîtresse R1). */
      setText(sheet, 'R1', data.accountingYearName);

      /** Libellé complet (zone X3) — peut partager une fusion avec H9 selon le modèle. */
      setText(sheet, 'X3', data.trimestreLibelle);

      /**
       * `trimestreLibelle` type « Premier Trimestre 2025 » : H9 · IJ9 · KLMN9 (maîtresses I9, K9).
       * Toujours écrire H9/I9/K9 en dernier pour que le découpage écrase un libellé complet
       * éventuellement déjà injecté sur la cellule maître de la fusion.
       */
      const [q1, q2, q3] = splitQuarterNameIntoThreeParts(data.trimestreLibelle);
      setText(sheet, 'H9', q1);
      setText(sheet, 'I9', q2);
      setText(sheet, 'K9', q3);

      setText(sheet, 'G16', d.raisonSociale);
      setText(sheet, 'F17', d.sigle);
      setText(sheet, 'J17', d.forme);
      setText(sheet, 'E20', d.profession);

      const nd = d.nineaDigits.map((ch) => (ch ?? '').trim());
      /** Ligne 20 : K→Q puis S→U (la colonne R est laissée vide). */
      const nineaCols = ['K', 'L', 'M', 'N', 'O', 'P', 'Q', 'S', 'T', 'U'];
      for (let i = 0; i < 10; i++) {
        const ch = nd[i] ?? '';
        if (/\d/.test(ch)) {
          setText(sheet, `${nineaCols[i]}20`, ch);
        }
      }

      setText(sheet, 'E22', d.adresse);
      setText(sheet, 'I22', d.rueDetail);
      setText(sheet, 'P22', d.quartier);
      setText(sheet, 'E23', d.localite);
      setText(sheet, 'H23', d.postalCode);
      setText(sheet, 'P23', d.tel);

      setText(sheet, 'F24', data.comptable.nomEtAdresse);
      setText(sheet, 'K24', data.comptable.bp);
      setText(sheet, 'P24', data.comptable.tel);

      setText(sheet, 'F25', data.exercice.du);
      setText(sheet, 'J25', data.exercice.au);

      /** Données lignes : D nom · F adresse · I montant sommes versées · K IR · O période · S NINEA (aucune cellule vidée). */
      const DATA_START = 29;
      const maxRows = 200;
      const rows = data.beneficiaries.slice(0, maxRows);
      for (let i = 0; i < rows.length; i++) {
        const r = DATA_START + i;
        const b = rows[i];
        setText(sheet, `D${r}`, b.nom);
        setText(sheet, `F${r}`, b.adresse);
        setText(sheet, `I${r}`, b.montantVerse);
        setText(sheet, `K${r}`, b.irRetenu);
        setText(sheet, `O${r}`, b.periode);
        setText(sheet, `S${r}`, b.ninea);
      }

      clearWorkbookDefinedNamesBeforeSave(workbook);
      const out = await workbook.xlsx.writeBuffer();
      return Buffer.from(out);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new InternalServerErrorException(
        `Génération Excel « État trimestriel des sommes versées » impossible: ${msg}`,
      );
    }
  }
}
