import type { AccountingQuarter, AccountingYear, Prisma } from '@prisma/client';
import type { ClientForExport } from './tiers-export.include';
import type { EtatAnnuelSommesVerseesFormData } from '../excel-reports/types/etat-annuel-sommes-versees.types';
import type { EtatTrimestrielSommesVerseesFormData } from '../excel-reports/types/etat-trimestriel-sommes-versees.types';

/**
 * Champs optionnels :
 * - `tier.meta` (chaque ligne du tableau) : `beneficiaryAddress`, `montantVerse`, `irRetenu`, `periode`
 * - `formMeta` (souvent le meta du tiers « ancre ») : `trimestre`, `annee` (état annuel), `sigle`, `profession`, `declarantRue`,
 *   `declarantQuartier`, `declarantTel`, `exerciceDu`, `exerciceAu`
 * - `client.meta` : `tel`, `bp` / `boitePostale` (boîte postale du **client** déclarant), `comptableNomAdresse`, `comptableBp`, `comptableTel`
 */

export type TierLineForExport = {
  id: string;
  name: string;
  ninea: string;
  meta: Prisma.JsonValue;
};

type TierSumsById = Map<
  string,
  {
    montantVerse: number;
    irRetenu: number;
  }
>;

function dash(s: string | null | undefined): string {
  const t = (s ?? '').trim();
  return t.length > 0 ? t : '';
}

function makeClientAbbreviation(clientName: string): string {
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

/** Boîte postale du déclarant : uniquement `client.meta` (`bp`, `boitePostale`, …), pas le tiers. */
function readDeclarantBpFromClient(
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

function formatAmount(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(value);
}

function formatDayMonth(value: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
  }).format(value);
}

/**
 * Forme attendue par le modèle Excel (3 segments : ordre · « Trimestre » · année),
 * ex. `Premier Trimestre 2025`. Si `quarter.name` est au format `T1 2025`, on normalise.
 */
function trimestreLibelleForExcel(quarter: AccountingQuarter): string {
  const raw = (quarter.name ?? '').trim();
  const m = raw.match(/^T\s*([1-4])\s+(\d{4})$/i);
  if (!m) {
    return raw;
  }
  const ord = ['Premier', 'Deuxième', 'Troisième', 'Quatrième'];
  const i = parseInt(m[1], 10) - 1;
  const year = m[2];
  if (i >= 0 && i < 4) {
    return `${ord[i]} Trimestre ${year}`;
  }
  return raw;
}

/**
 * Zone haute = client + meta client + meta formulaire (`formMeta`).
 * Tableau = une ligne par tiers du client (`tierLines`), montants dans `tier.meta`.
 */
export function buildSenegalQuarterlyFormData( client: ClientForExport, formMeta: Prisma.JsonValue | null | undefined, quarter: AccountingQuarter & { accountingYear: { name: string } }, tierLines: TierLineForExport[], sumsByTierId: TierSumsById): EtatTrimestrielSommesVerseesFormData {
  const m = formMeta as Record<string, unknown> | null;
  const cm = client.meta as Record<string, unknown> | null;
  const exerciceDu = formatDate(quarter.monthStartDate);
  const exerciceAu = formatDate(quarter.endDate);
  const periodeLabel = `${formatDayMonth(quarter.monthStartDate)} - ${formatDayMonth(quarter.endDate)}`;

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
    trimestreLibelle: readMetaString(
      m,
      'trimestre',
      trimestreLibelleForExcel(quarter),
    ),
    accountingYearName: quarter.accountingYear.name,
    declarant: {
      raisonSociale: dash(client.name),
      sigle: makeClientAbbreviation(client.name),
      forme: `${dash(client.legalForm.name)} (${dash(client.legalForm.code)})`,
      profession: readMetaString(m, 'profession', ''),
      nineaDigits: nineaDigits(client.ninea),
      adresse: addrParts.adresse,
      rueDetail: addrParts.rueDetail,
      quartier: addrParts.quartier,
      localite: dash(client.region.name),
      postalCode: dash(client.postalCode),
      bp: readDeclarantBpFromClient(cm),
      tel: readMetaString(m, 'declarantTel', readMetaString(cm, 'tel', '')),
    },
    comptable: {
      nomEtAdresse: readMetaString(cm, 'comptableNomAdresse', ''),
      bp: readMetaString(cm, 'comptableBp', ''),
      tel: readMetaString(cm, 'comptableTel', ''),
    },
    exercice: {
      du: readMetaString(m, 'exerciceDu', exerciceDu),
      au: readMetaString(m, 'exerciceAu', exerciceAu),
    },
    beneficiaries: tierLines
      .filter((t) => sumsByTierId.has(t.id))
      .map((t) => {
        const sums = sumsByTierId.get(t.id) ?? { montantVerse: 0, irRetenu: 0 };
        return {
          nom: dash(t.name),
          adresse: readMetaString(t.meta, 'beneficiaryAddress', ''),
          montantVerse: formatAmount(sums.montantVerse),
          irRetenu: formatAmount(sums.irRetenu),
          periode: readMetaString(t.meta, 'periode', periodeLabel),
          ninea: dash(t.ninea),
        };
      }),
  };
}

/**
 * État annuel : même zone haute que le trimestriel, période = exercice comptable entier.
 */
export function buildSenegalAnnualFormData( client: ClientForExport, formMeta: Prisma.JsonValue | null | undefined, year: AccountingYear, tierLines: TierLineForExport[], sumsByTierId: TierSumsById ): EtatAnnuelSommesVerseesFormData {
  const m = formMeta as Record<string, unknown> | null;
  const cm = client.meta as Record<string, unknown> | null;
  const exerciceDu = formatDate(year.startDate);
  const exerciceAu = formatDate(year.endDate);
  const periodeLabel = `${formatDayMonth(year.startDate)} - ${formatDayMonth(year.endDate)}`;

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
    periodeAnnuelleLibelle: readMetaString(m, 'annee', year.name),
    accountingYearName: year.name,
    declarant: {
      raisonSociale: dash(client.name),
      sigle: makeClientAbbreviation(client.name),
      forme: `${dash(client.legalForm.name)} (${dash(client.legalForm.code)})`,
      profession: readMetaString(m, 'profession', ''),
      nineaDigits: nineaDigits(client.ninea),
      adresse: addrParts.adresse,
      rueDetail: addrParts.rueDetail,
      quartier: addrParts.quartier,
      localite: dash(client.region.name),
      postalCode: dash(client.postalCode),
      bp: readDeclarantBpFromClient(cm),
      tel: readMetaString(m, 'declarantTel', readMetaString(cm, 'tel', '')),
    },
    comptable: {
      nomEtAdresse: readMetaString(cm, 'comptableNomAdresse', ''),
      bp: readMetaString(cm, 'comptableBp', ''),
      tel: readMetaString(cm, 'comptableTel', ''),
    },
    exercice: {
      du: readMetaString(m, 'exerciceDu', exerciceDu),
      au: readMetaString(m, 'exerciceAu', exerciceAu),
    },
    beneficiaries: tierLines
      .filter((t) => sumsByTierId.has(t.id))
      .map((t) => {
        const sums = sumsByTierId.get(t.id) ?? { montantVerse: 0, irRetenu: 0 };
        return {
          nom: dash(t.name),
          adresse: readMetaString(t.meta, 'beneficiaryAddress', ''),
          montantVerse: formatAmount(sums.montantVerse),
          irRetenu: formatAmount(sums.irRetenu),
          periode: readMetaString(t.meta, 'periode', periodeLabel),
          ninea: dash(t.ninea),
        };
      }),
  };
}
