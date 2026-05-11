import type { AccountingQuarter, AccountingYear, Prisma } from '@prisma/client';
import type { EtatAnnuelSommesVerseesFormData } from '../excel-reports/types/etat-annuel-sommes-versees.types';
import type { EtatTrimestrielSommesVerseesFormData } from '../excel-reports/types/etat-trimestriel-sommes-versees.types';
import type { ClientForExport } from './tiers-export.include';
import type { TierLineForExport, TierSumsById } from './tiers-senegal-form.types';
import { dash, formatAmount, formatDate, formatDayMonth, makeClientAbbreviation, nineaDigits, readDeclarantBpFromClient, readMetaString, splitDeclarantAddress, trimestreLibelleForExcel } from './tiers-senegal-form.helpers';

/**
 * Zone haute = client + meta client + meta formulaire (`formMeta`).
 * Tableau = une ligne par tiers du client (`tierLines`), montants dans `tier.meta`.
 */
export function buildSenegalQuarterlyFormData(
  client: ClientForExport,
  formMeta: Prisma.JsonValue | null | undefined,
  quarter: AccountingQuarter & { accountingYear: { name: string } },
  tierLines: TierLineForExport[],
  sumsByTierId: TierSumsById,
): EtatTrimestrielSommesVerseesFormData {
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
 * Etat annuel : meme zone haute que le trimestriel, periode = exercice comptable entier.
 */
export function buildSenegalAnnualFormData(
  client: ClientForExport,
  formMeta: Prisma.JsonValue | null | undefined,
  year: AccountingYear,
  tierLines: TierLineForExport[],
  sumsByTierId: TierSumsById,
): EtatAnnuelSommesVerseesFormData {
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
