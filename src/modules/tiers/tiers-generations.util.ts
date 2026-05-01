import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Enregistre une copie du classeur sous `generations/` (racine du projet).
 *
 * - **Hors production** : activé par défaut (désactiver avec `TIERS_SAVE_GENERATIONS=0`).
 * - **Production** : uniquement si `TIERS_SAVE_GENERATIONS=1`.
 */
export function saveTierExcelToGenerations(
  buffer: Buffer,
  generatedName: string,
): void {
  const explicitOff =
    process.env.TIERS_SAVE_GENERATIONS === '0' ||
    process.env.TIERS_SAVE_GENERATIONS === 'false';
  if (explicitOff) {
    return;
  }
  const isProd = process.env.NODE_ENV === 'production';
  const explicitOn = process.env.TIERS_SAVE_GENERATIONS === '1';
  if (isProd && !explicitOn) {
    return;
  }

  const dir = join(process.cwd(), 'generations');
  mkdirSync(dir, { recursive: true });
  const safeName = generatedName
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '')
    .toLowerCase();
  const name = `${safeName || 'etat'}.xlsx`;
  writeFileSync(join(dir, name), buffer);
}
