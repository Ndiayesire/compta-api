import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Enregistre une copie du classeur sous `generations/` (racine du projet).
 *
 * - **Hors production** : activé par défaut (désactiver avec `TIERS_SAVE_GENERATIONS=0`).
 * - **Production** : uniquement si `TIERS_SAVE_GENERATIONS=1`.
 */
export function saveTierExcelToGenerations(buffer: Buffer, tierId: string): void {
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
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeId = tierId.replace(/[^a-zA-Z0-9-]/g, '_');
  const name = `tier-${safeId}-${stamp}.xlsx`;
  writeFileSync(join(dir, name), buffer);
}
