import { normalizeImportHeader } from './employee-excel-import';

describe('normalizeImportHeader', () => {
  it('ignore accents et casse', () => {
    expect(normalizeImportHeader('Téléphone')).toBe('telephone');
    expect(normalizeImportHeader('  Nom du client  ')).toBe('nom du client');
  });
});
