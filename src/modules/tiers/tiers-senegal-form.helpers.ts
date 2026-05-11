import type { AccountingQuarter } from '@prisma/client';

export function dash(s: string | null | undefined): string {
  const t = (s ?? '').trim();
  return t.length > 0 ? t : '';
}

export function makeClientAbbreviation(clientName: string): string {
  const words = dash(clientName)
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0);

  if (words.length === 0) {
    return '';
  }
  return words
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 6);
}

export function nineaDigits(raw: string | undefined | null): string[] {
  const d = (raw ?? '').replace(/\D/g, '').slice(0, 10);
  const padded = d.padStart(10, ' ');
  return padded.split('');
}

/**
 * Repartit l'adresse sur les 3 cases du 1er bandeau (sans dupliquer tout le texte dans chaque case).
 * Priorite aux cles meta ; sinon decoupe par virgules / point-virgules sur `address`.
 */
export function splitDeclarantAddress(
  fullAddress: string,
  metaRue: string,
  metaQuartier: string,
): { adresse: string; rueDetail: string; quartier: string } {
  const rue = metaRue.trim();
  const quart = metaQuartier.trim();
  const parts = fullAddress
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const first = parts[0] ?? fullAddress.trim();

  if (rue || quart) {
    const rueDetail = rue && rue !== first ? rue : (parts[1] ?? '');
    const quartier =
      quart ||
      (parts.length > 2 ? parts.slice(2).join(', ') : (parts[2] ?? ''));
    return {
      adresse: first || fullAddress.trim(),
      rueDetail,
      quartier,
    };
  }
  return {
    adresse: parts[0] ?? '',
    rueDetail: parts[1] ?? '',
    quartier: parts[2] ?? '',
  };
}

export function readMetaString(
  meta: unknown,
  key: string,
  fallback = '',
): string {
  if (meta === null || meta === undefined || typeof meta !== 'object') {
    return fallback;
  }
  const v = (meta as Record<string, unknown>)[key];
  if (v === undefined || v === null) {
    return fallback;
  }
  return String(v);
}

/** Boite postale du declarant: uniquement `client.meta` (`bp`, `boitePostale`, ...), pas le tiers. */
export function readDeclarantBpFromClient(
  clientMeta: Record<string, unknown> | null | undefined,
): string {
  if (!clientMeta || typeof clientMeta !== 'object') {
    return '';
  }
  for (const key of ['bp', 'boitePostale', 'boite_postale', 'BP']) {
    const v = readMetaString(clientMeta, key, '');
    if (v.trim().length > 0) {
      return v.trim();
    }
  }
  return '';
}

export function formatAmount(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(value: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(value);
}

export function formatDayMonth(value: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
  }).format(value);
}

/**
 * Forme attendue par le modele Excel (3 segments: ordre · "Trimestre" · annee),
 * ex. `Premier Trimestre 2025`.
 *
 * La base stocke maintenant deja ce libelle ; la normalisation `T1 2025` est
 * conservee uniquement pour retrocompatibilite avec d'anciennes donnees.
 */
export function trimestreLibelleForExcel(quarter: AccountingQuarter): string {
  const raw = (quarter.name ?? '').trim();
  const m = raw.match(/^T\s*([1-4])\s+(\d{4})$/i);
  if (!m) {
    return raw;
  }
  const ord = ['Premier', 'Deuxieme', 'Troisieme', 'Quatrieme'];
  const i = parseInt(m[1], 10) - 1;
  const year = m[2];
  if (i >= 0 && i < 4) {
    return `${ord[i]} Trimestre ${year}`;
  }
  return raw;
}
