import { existsSync } from 'fs';
import { join, normalize } from 'path';

/**
 * Résout un fichier sous `src/assets` après build.
 * `nest-cli` le copie vers `dist/assets/...` (au même niveau que `dist/src/...`, pas dans `dist/src/assets`).
 */
export function resolveBundledAsset(relativePath: string): string {
  const relative = normalize(relativePath).replace(/^[\\/]+/, '');
  const segments = relative.split(/[/\\]/).filter((s) => s.length > 0);
  const candidates = [
    join(__dirname, '..', '..', '..', 'assets', ...segments),
    join(process.cwd(), 'dist', 'assets', ...segments),
    join(process.cwd(), 'src', 'assets', ...segments),
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      return p;
    }
  }
  throw new Error(
    `Fichier d'actifs introuvable: src/assets/${relative} (vérifier nest-cli et le répertoire de lancement)`,
  );
}
