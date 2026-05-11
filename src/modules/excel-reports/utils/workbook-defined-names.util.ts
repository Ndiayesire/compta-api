import type { Workbook } from 'exceljs';

/**
 * Après lecture d’un modèle **.xlsx** avec ExcelJS, les **plages nommées** héritées du fichier
 * sont parfois réécrites de façon **incompatible** (références cassées) : Excel affiche alors
 * « Enregistrements supprimés : Plage nommée » dans `/xl/workbook.xml`.
 *
 * Les noms d’impression officiels (`_xlnm.Print_Area`, etc.) sont déjà reflétés dans
 * `worksheet.pageSetup` après parsing ; ExcelJS les **réinjecte** à partir de `printArea`
 * au moment du `writeBuffer`. On vide donc la collection interne pour ne garder que ce
 * mécanisme, et éviter les doublons / noms métier invalides issus du template.
 */
export function clearWorkbookDefinedNamesBeforeSave(workbook: Workbook): void {
  workbook.definedNames.model = [];
}
