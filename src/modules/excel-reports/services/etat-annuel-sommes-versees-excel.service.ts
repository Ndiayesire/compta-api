import { Injectable, InternalServerErrorException } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { resolveBundledAsset } from '../../../common/utils/resolve-bundled-asset.util';
import type { EtatAnnuelSommesVerseesFormData } from '../types/etat-annuel-sommes-versees.types';

const TEMPLATE_FILENAME = 'etat-annuel-sommes-versees.xlsx' as const;

const TEMPLATE_PAGE_MARGINS = {
  left: 0.7,
  right: 0.7,
  top: 0.75,
  bottom: 0.75,
  header: 0.3,
  footer: 0.3,
} as const;

const PAPER_A4 = 9;
const TEMPLATE_PRINT_AREA = 'A1:W228';

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
 * Génère le classeur « État annuel des sommes versées » à partir du modèle Excel.
 * Les lignes de données commencent à la ligne 28 (template annuel).
 */
@Injectable()
export class EtatAnnuelSommesVerseesExcelService {
  async fillWorkbook(data: EtatAnnuelSommesVerseesFormData): Promise<Buffer> {
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

      /** Année de référence : fusion Q2–T2 → valeur dans Q2 uniquement. */
      setText(sheet, 'Q2', data.accountingYearName);

      setText(sheet, 'G16', d.raisonSociale);
      setText(sheet, 'F17', d.sigle);
      setText(sheet, 'J17', d.forme);
      setText(sheet, 'E20', d.profession);

      /** Ligne 19 : K→Q puis S→U (colonne R vide), modèle annuel DGID. */
      const nd = d.nineaDigits.map((ch) => (ch ?? '').trim());
      const nineaCols = ['K', 'L', 'M', 'N', 'O', 'P', 'Q', 'S', 'T', 'U'];
      for (let i = 0; i < 10; i++) {
        const ch = nd[i] ?? '';
        if (/\d/.test(ch)) {
          setText(sheet, `${nineaCols[i]}19`, ch);
        }
      }

      /**
       * Code postal déclarant : H22 (fusion H22–I22 sur le modèle).
       * Fusion F23–I23 : non renseignée par le code.
       */
      setText(sheet, 'E21', d.adresse);
      setText(sheet, 'I21', d.rueDetail);
      setText(sheet, 'P21', d.quartier);
      setText(sheet, 'H22', d.postalCode);
      setText(sheet, 'E22', d.localite);
      setText(sheet, 'P23', d.tel);

      setText(sheet, 'F24', data.exercice.du);
      setText(sheet, 'J24', data.exercice.au);

      setText(sheet, 'F25', data.comptable.nomEtAdresse);
      setText(sheet, 'K25', data.comptable.bp);
      setText(sheet, 'P25', data.comptable.tel);

      /**
       * Tableau : D nom · H adresse tiers (fusion HI) · N,O montants (fusion N–S) · T NINEA (fusion T–W).
       * Aucune écriture dans les cellules « vides » du modèle (Qualité, Nature, etc.).
       */
      const DATA_START = 28;
      const maxRows = 200;
      const rows = data.beneficiaries.slice(0, maxRows);
      for (let i = 0; i < rows.length; i++) {
        const r = DATA_START + i;
        const b = rows[i];
        setText(sheet, `D${r}`, b.nom);
        setText(sheet, `H${r}`, b.adresse);
        setText(sheet, `N${r}`, b.montantVerse);
        setText(sheet, `O${r}`, b.irRetenu);
        setText(sheet, `T${r}`, b.ninea);
      }

      const out = await workbook.xlsx.writeBuffer();
      return Buffer.from(out);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new InternalServerErrorException(
        `Génération Excel « État annuel des sommes versées » impossible: ${msg}`,
      );
    }
  }
}
