import { existsSync } from 'fs';
import { join } from 'path';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import ExcelJS from 'exceljs';
import type { SenegalQuarterlyFormData } from './tiers-senegal-form.types';

/**
 * Marges du modèle `Template-tiers.xlsx` (`<pageMargins>` en pouces OOXML).
 * Réappliquées après lecture pour que le PDF (LibreOffice) suive la même zone utile qu’Excel.
 */
const SENEGAL_TEMPLATE_PAGE_MARGINS = {
  left: 0.7,
  right: 0.7,
  top: 0.75,
  bottom: 0.75,
  header: 0.3,
  footer: 0.3,
} as const;

/** OOXML / Excel : 9 = A4 (évite un format implicite type Letter côté conversion PDF). */
const PAPER_A4 = 9;

function applySenegalTemplatePrintLayout(sheet: ExcelJS.Worksheet): void {
  sheet.pageSetup.margins = { ...SENEGAL_TEMPLATE_PAGE_MARGINS };
  sheet.pageSetup.paperSize = PAPER_A4;
  sheet.pageSetup.orientation = 'portrait';
  sheet.pageSetup.scale = 100;
}

function resolveTemplatePath(): string {
  const candidates = [
    join(__dirname, '..', '..', '..', 'assets', 'xlsx', 'Template-tiers.xlsx'),
    join(process.cwd(), 'dist', 'assets', 'xlsx', 'Template-tiers.xlsx'),
    join(process.cwd(), 'src', 'assets', 'xlsx', 'Template-tiers.xlsx'),
    join(process.cwd(), 'public', 'Template-tiers.xlsx'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      return p;
    }
  }
  throw new Error(
    'Modèle Excel introuvable: src/assets/xlsx/Template-tiers.xlsx',
  );
}

/** Ne modifie que la valeur (pas le style) — le classeur reste celui du fichier modèle. */
function setText(sheet: ExcelJS.Worksheet, address: string, value: string): void {
  const v = (value ?? '').trim();
  sheet.getCell(address).value = v.length > 0 ? v : null;
}

/**
 * Charge le fichier modèle tel quel (ExcelJS) et n’écrit que les cellules à remplir.
 * Styles, fusions et mise en forme du template sont conservés.
 */
@Injectable()
export class TiersExcelTemplateService {
  async fillSenegalTemplateWorkbook(
    data: SenegalQuarterlyFormData,
  ): Promise<Buffer> {
    try {
      const templatePath = resolveTemplatePath();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(templatePath);

      const sheet =
        workbook.getWorksheet(1) ?? workbook.worksheets[0];
      if (!sheet) {
        throw new Error('Aucune feuille dans le modèle');
      }

      applySenegalTemplatePrintLayout(sheet);

      const d = data.declarant;

      setText(sheet, 'X3', data.trimestreLibelle);

      setText(sheet, 'G16', d.raisonSociale);
      setText(sheet, 'F17', d.sigle);
      setText(sheet, 'J17', d.forme);
      setText(sheet, 'E20', d.profession);

      const nd = d.nineaDigits.map((ch) => (ch ?? '').trim());
      /** Ligne 20 : K→Q puis S→U (la colonne R est laissée vide). */
      const nineaCols = ['K', 'L', 'M', 'N', 'O', 'P', 'Q', 'S', 'T', 'U'];
      for (let i = 0; i < 10; i++) {
        const ch = nd[i] ?? '';
        const addr = `${nineaCols[i]}20`;
        setText(sheet, addr, /\d/.test(ch) ? ch : '');
      }

      setText(sheet, 'E22', d.adresse);
      setText(sheet, 'I22', d.rueDetail);
      setText(sheet, 'P22', d.quartier);
      setText(sheet, 'E23', d.localite);
      setText(sheet, 'H23', d.bp);
      setText(sheet, 'P23', d.tel);

      setText(sheet, 'F24', data.comptable.nomEtAdresse);
      setText(sheet, 'K24', data.comptable.bp);
      setText(sheet, 'P24', data.comptable.tel);

      setText(sheet, 'F25', data.exercice.du);
      setText(sheet, 'J25', data.exercice.au);

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

      const out = await workbook.xlsx.writeBuffer();
      return Buffer.from(out);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new InternalServerErrorException(
        `Génération Excel tiers impossible: ${msg}`,
      );
    }
  }
}
