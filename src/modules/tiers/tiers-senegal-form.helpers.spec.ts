import type { AccountingQuarter } from '@prisma/client';
import {
  readDeclarantBpFromClient,
  splitDeclarantAddress,
  trimestreLibelleForExcel,
} from './tiers-senegal-form.helpers';

describe('tiers-senegal-form.helpers', () => {
  describe('trimestreLibelleForExcel', () => {
    it('retourne le libelle deja normalise depuis la base', () => {
      const quarter = {
        name: 'Premier Trimestre 2025',
      } as AccountingQuarter;

      expect(trimestreLibelleForExcel(quarter)).toBe('Premier Trimestre 2025');
    });

    it('normalise le format legacy T1 2025', () => {
      const quarter = {
        name: 'T1 2025',
      } as AccountingQuarter;

      expect(trimestreLibelleForExcel(quarter)).toBe('Premier Trimestre 2025');
    });
  });

  describe('splitDeclarantAddress', () => {
    it('priorise les valeurs meta quand elles existent', () => {
      const result = splitDeclarantAddress(
        'Dakar Plateau, Rue 12, Medina',
        'Rue 99',
        'Yoff',
      );

      expect(result).toEqual({
        adresse: 'Dakar Plateau',
        rueDetail: 'Rue 99',
        quartier: 'Yoff',
      });
    });

    it('decoupe l adresse en 3 segments quand meta vide', () => {
      const result = splitDeclarantAddress(
        'Dakar Plateau, Rue 12, Medina',
        '',
        '',
      );

      expect(result).toEqual({
        adresse: 'Dakar Plateau',
        rueDetail: 'Rue 12',
        quartier: 'Medina',
      });
    });
  });

  describe('readDeclarantBpFromClient', () => {
    it('lit BP depuis les cles supportees', () => {
      expect(
        readDeclarantBpFromClient({ boitePostale: 'BP 1000 Dakar' }),
      ).toBe('BP 1000 Dakar');
    });

    it('retourne vide si aucune valeur utile', () => {
      expect(readDeclarantBpFromClient({ bp: '   ' })).toBe('');
      expect(readDeclarantBpFromClient(null)).toBe('');
    });
  });
});
