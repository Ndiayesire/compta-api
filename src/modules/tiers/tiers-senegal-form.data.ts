import type { Prisma } from '@prisma/client';
import type { ClientForExport } from './tiers-export.include';
import type { SenegalQuarterlyFormData } from './tiers-senegal-form.types';

/**
 * Champs optionnels :
 * - `tier.meta` (chaque ligne du tableau) : `beneficiaryAddress`, `montantVerse`, `irRetenu`, `periode`
 * - `formMeta` (souvent le meta du tiers « ancre ») : `trimestre`, `sigle`, `profession`, `declarantRue`,
 *   `declarantQuartier`, `bp`, `declarantTel`, `exerciceDu`, `exerciceAu`
 * - `client.meta` : `tel`, `comptableNomAdresse`, `comptableBp`, `comptableTel`
 */

export type TierLineForExport = {
  name: string;
  ninea: string;
  meta: Prisma.JsonValue;
};

function dash(s: string | null | undefined): string {
  const t = (s ?? '').trim();
  return t.length > 0 ? t : '';
}

function nineaDigits(raw: string | undefined | null): string[] {
  const d = (raw ?? '').replace(/\D/g, '').slice(0, 10);
  const padded = d.padStart(10, ' ');
  return padded.split('');
}

/**
 * Répartit l'adresse sur les 3 cases du 1er bandeau (sans dupliquer tout le texte dans chaque case).
 * Priorité aux clés meta ; sinon découpe par virgules / point-virgules sur `address`.
 */
function splitDeclarantAddress(
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
    const rueDetail =
      rue && rue !== first ? rue : (parts[1] ?? '');
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

function readMetaString(
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

/**
 * Zone haute = client + meta client + meta formulaire (`formMeta`).
 * Tableau = une ligne par tiers du client (`tierLines`), montants dans `tier.meta`.
 */
export function buildSenegalQuarterlyFormData(
  client: ClientForExport,
  formMeta: Prisma.JsonValue | null | undefined,
  tierLines: TierLineForExport[],
): SenegalQuarterlyFormData {
  const m = formMeta as Record<string, unknown> | null;
  const cm = client.meta as Record<string, unknown> | null;

  const declarantRue = readMetaString(
    m,
    'declarantRue',
    dash(client.address).split(',')[0] || '',
  );
  const declarantQuartier = readMetaString(m, 'declarantQuartier', '');
  const addrParts = splitDeclarantAddress(
    dash(client.address),
    declarantRue,
    declarantQuartier,
  );

  return {
    trimestreLibelle: readMetaString(m, 'trimestre', ' '),
    declarant: {
      raisonSociale: dash(client.name),
      sigle: readMetaString(m, 'sigle', ''),
      forme: `${dash(client.legalForm.name)} (${dash(client.legalForm.code)})`,
      profession: readMetaString(m, 'profession', ''),
      nineaDigits: nineaDigits(client.ninea),
      adresse: addrParts.adresse,
      rueDetail: addrParts.rueDetail,
      quartier: addrParts.quartier,
      localite: dash(client.region.name),
      bp: readMetaString(m, 'bp', ''),
      tel: readMetaString(m, 'declarantTel', readMetaString(cm, 'tel', '')),
    },
    comptable: {
      nomEtAdresse: readMetaString(cm, 'comptableNomAdresse', ''),
      bp: readMetaString(cm, 'comptableBp', ''),
      tel: readMetaString(cm, 'comptableTel', ''),
    },
    exercice: {
      du: readMetaString(m, 'exerciceDu', ''),
      au: readMetaString(m, 'exerciceAu', ''),
    },
    beneficiaries: tierLines.map((t) => ({
      nom: dash(t.name),
      adresse: readMetaString(t.meta, 'beneficiaryAddress', ''),
      montantVerse: readMetaString(t.meta, 'montantVerse', ''),
      irRetenu: readMetaString(t.meta, 'irRetenu', ''),
      periode: readMetaString(t.meta, 'periode', ''),
      ninea: dash(t.ninea),
    })),
  };
}
