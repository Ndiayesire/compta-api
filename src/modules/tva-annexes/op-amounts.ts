/** Complétion du triplet net / tax / total (processus_calcul_tva.md §2). */

export type NetTaxTotal = {
  net: number | null;
  tax: number | null;
  total: number | null;
};

export type CompletedNetTaxTotal = {
  net: number;
  tax: number;
  total: number;
};

function isKnown(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value);
}

function roundXof(n: number): number {
  return Math.round(n + Number.EPSILON);
}

/**
 * Complète le triplet `total = net + tax`.
 * - 3 valeurs → inchangé
 * - 2 valeurs → déduit la troisième
 * - 1 valeur `total` seule + `stampFallback` → règle 82/18 (timbres)
 * - sinon → null (ligne invalide)
 */
export function completeNetTaxTotal(
  input: NetTaxTotal,
  options?: { stampFallback?: boolean },
): CompletedNetTaxTotal | null {
  let { net, tax, total } = input;
  const known =
    (isKnown(net) ? 1 : 0) + (isKnown(tax) ? 1 : 0) + (isKnown(total) ? 1 : 0);

  if (known === 3) {
    return {
      net: roundXof(net!),
      tax: roundXof(tax!),
      total: roundXof(total!),
    };
  }

  if (known === 2) {
    if (!isKnown(net)) {
      net = roundXof(total! - tax!);
    } else if (!isKnown(tax)) {
      tax = roundXof(total! - net!);
    } else {
      total = roundXof(net! + tax!);
    }
    return { net: net!, tax: tax!, total: total! };
  }

  if (known === 1 && options?.stampFallback && isKnown(total) && !isKnown(net) && !isKnown(tax)) {
    return {
      net: roundXof(total * 0.82),
      tax: roundXof(total * 0.18),
      total: roundXof(total),
    };
  }

  return null;
}

export function sumCompletedNet(
  rows: Array<{ net?: unknown; tax?: unknown; total?: unknown }>,
): number {
  let sum = 0;
  for (const row of rows) {
    const completed = completeNetTaxTotal({
      net: toNullableNumber(row.net),
      tax: toNullableNumber(row.tax),
      total: toNullableNumber(row.total),
    });
    if (completed) sum += completed.net;
  }
  return sum;
}

export function sumTaxDeductionOrTax(
  rows: Array<{ tax?: unknown; taxDeduction?: unknown; net?: unknown; total?: unknown }>,
): number {
  let sum = 0;
  for (const row of rows) {
    const completed = completeNetTaxTotal({
      net: toNullableNumber(row.net),
      tax: toNullableNumber(row.tax),
      total: toNullableNumber(row.total),
    });
    const taxDeduction = toNullableNumber(row.taxDeduction);
    if (isKnown(taxDeduction) && taxDeduction > 0) {
      sum += roundXof(taxDeduction);
    } else if (completed) {
      sum += completed.tax;
    }
  }
  return sum;
}

export function sumRetainAmount(
  rows: Array<{ amount?: unknown; base?: unknown; rate?: unknown }>,
): number {
  let sum = 0;
  for (const row of rows) {
    const amount = toNullableNumber(row.amount);
    if (isKnown(amount)) {
      sum += roundXof(amount);
      continue;
    }
    const base = toNullableNumber(row.base);
    const rate = toNullableNumber(row.rate);
    if (isKnown(base) && isKnown(rate)) {
      sum += roundXof((base * rate) / 100);
    }
  }
  return sum;
}

export function toNullableNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    const n = (value as { toNumber: () => number }).toNumber();
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
