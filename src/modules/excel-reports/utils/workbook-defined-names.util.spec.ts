import { clearWorkbookDefinedNamesBeforeSave } from './workbook-defined-names.util';

describe('clearWorkbookDefinedNamesBeforeSave', () => {
  it('vide le modèle des plages nommées', () => {
    const workbook = {
      definedNames: {
        model: [{ name: 'LegacyRange', ranges: ["'Feuil1'!$A$1:$B$2"] }],
      },
    } as import('exceljs').Workbook;

    clearWorkbookDefinedNamesBeforeSave(workbook);

    expect(workbook.definedNames.model).toEqual([]);
  });
});
