/** Moteur de calcul annexe fiscale TVA (lignes L5–L115). */

export type TvaAnnexRates = {
  /** Taux réduit en % (ex. 10) */
  reducedRate: number;
  /** Taux normal en % (ex. 18, provenant du pays) */
  normalRate: number;
};

export type TvaAnnexInputs = {
  /** L5 — SUM(op_turnover_tax) */
  l5: number;
  /** L10 — SUM(op_exportation_tax) */
  l10: number;
  /** L15 — SUM(op_exemption_amount) */
  l15: number;
  /** L20 — SUM(op_suspension_tax) */
  l20: number;
  /** L30 — Auto-livraisons (informatif) */
  l30: number;
  /** L40 — Part taxe au taux réduit (ventilation / saisie) */
  l40: number;
  /** L65 — Affaires soumises au précompte (informatif) */
  l65: number;
  /** L70 — Précompte TVA (retenues) */
  l70: number;
  /** L75 — Chèques DDI */
  l75: number;
  /** L80 — SUM(op_importation_tax) */
  l80: number;
  /** L85 — TVA déductible importations */
  l85: number;
  /** L90 — TVA déductible achats locaux */
  l90: number;
  /** L100 — Crédit reporté du mois précédent */
  l100: number;
  /** L95 / L120 — saisie manuelle (informatifs) */
  l95: number;
  l120: number;
  /** L60 — SUM(op_turnover_tax) ; défaut = l5 */
  l60TurnoverTax?: number;
};

export type TvaAnnexLine = {
  code: string;
  label: string;
  type: 'input' | 'calc' | 'balance';
  amount: number;
  formula?: string;
  source?: string;
};

export type TvaAnnexResult = {
  rates: TvaAnnexRates;
  lines: Record<string, TvaAnnexLine>;
  payable: number;
  creditCarryForward: number;
};

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function max0(n: number): number {
  return n > 0 ? n : 0;
}

function ventilateTurnoverTax(
  l60Collected: number,
  l40: number,
  l45: number,
  rates: TvaAnnexRates,
): { l50: number; l55: number; l60: number; mode: 'collected' | 'formula' } {
  const l50Formula = round2(l40 * (rates.reducedRate / 100));
  const l55Formula = round2(l45 * (rates.normalRate / 100));

  if (l60Collected > 0) {
    if (l40 > 0 && l50Formula + l55Formula > 0) {
      const l50 = round2(l60Collected * (l50Formula / (l50Formula + l55Formula)));
      return {
        l50,
        l55: round2(l60Collected - l50),
        l60: l60Collected,
        mode: 'collected',
      };
    }
    return { l50: l50Formula, l55: l55Formula, l60: l60Collected, mode: 'collected' };
  }

  const l50 = l50Formula;
  const l55 = l55Formula;
  return { l50, l55, l60: round2(l50 + l55), mode: 'formula' };
}

/**
 * Calcule l’annexe TVA à partir des agrégats d’entrée.
 * Formules alignées sur `processus_calcul_tva.md` (colonnes `*_tax` uniquement).
 */
export function computeTvaAnnex(
  inputs: TvaAnnexInputs,
  rates: TvaAnnexRates,
): TvaAnnexResult {
  const l5 = round2(inputs.l5);
  const l10 = round2(inputs.l10);
  const l15 = round2(inputs.l15);
  const l20 = round2(inputs.l20);
  const l30 = round2(inputs.l30);
  const l40 = round2(inputs.l40);
  const l65 = round2(inputs.l65);
  const l70 = round2(inputs.l70);
  const l75 = round2(inputs.l75);
  const l80 = round2(inputs.l80);
  const l85 = round2(inputs.l85);
  const l90 = round2(inputs.l90);
  const l95 = round2(inputs.l95);
  const l100 = round2(inputs.l100);
  const l120 = round2(inputs.l120);
  const l60Collected = round2(inputs.l60TurnoverTax ?? inputs.l5);

  const l25 = round2(l10 + l15 + l20);
  const l35 = round2(l5 - l25);
  const l45 = round2(l35 - l40);
  const { l50, l55, l60, mode: l60Mode } = ventilateTurnoverTax(l60Collected, l40, l45, rates);
  const l76 = round2(l70 + l75);
  const l91 = round2(l85 + l90);
  const l92 = round2(l76 + l91);
  const l93 = round2(l60 - l92);
  const l105 = round2(l70 + l75 + l85 + l90 + l100);
  const l110 = round2(max0(l60 - l105));
  const l115 = round2(max0(l105 - l60));

  const l50Formula =
    l40 > 0 ? `ventilation L60 (taux réduit)` : `L40 × ${rates.reducedRate}% (secours)`;
  const l55Formula =
    l40 > 0 ? `ventilation L60 (taux normal)` : `L45 × ${rates.normalRate}% (secours)`;
  const l60Formula =
    l60Mode === 'collected' ? 'SUM(op_turnover_tax)' : 'L50 + L55 (secours)';

  const lines: Record<string, TvaAnnexLine> = {
    L5: {
      code: 'L5',
      label: 'Montant des opérations',
      type: 'input',
      amount: l5,
      source: 'op_turnovers.tax',
    },
    L10: {
      code: 'L10',
      label: 'Affaires à l’exportation',
      type: 'input',
      amount: l10,
      source: 'op_exportations.tax',
    },
    L15: {
      code: 'L15',
      label: 'Affaires réalisées à l’intérieur non taxées',
      type: 'input',
      amount: l15,
      source: 'op_exemptions.amount',
    },
    L20: {
      code: 'L20',
      label: 'Affaires réalisées en suspension de la TVA',
      type: 'input',
      amount: l20,
      source: 'op_suspensions.tax',
    },
    L25: {
      code: 'L25',
      label: 'Total affaires non soumises à la TVA',
      type: 'calc',
      amount: l25,
      formula: 'L10 + L15 + L20',
    },
    L30: {
      code: 'L30',
      label: 'Prélèvements et livraisons à soi-même',
      type: 'input',
      amount: l30,
      source: 'manual',
    },
    L35: {
      code: 'L35',
      label: 'Montant total taxable',
      type: 'calc',
      amount: l35,
      formula: 'L5 − L25',
    },
    L40: {
      code: 'L40',
      label: 'Montant taxable — taux réduit',
      type: 'input',
      amount: l40,
      source: 'manual (query reducedBase)',
    },
    L45: {
      code: 'L45',
      label: 'Montant taxable — taux normal',
      type: 'calc',
      amount: l45,
      formula: 'L35 − L40',
    },
    L50: {
      code: 'L50',
      label: 'Montant de la TVA — taux réduit',
      type: 'calc',
      amount: l50,
      formula: l50Formula,
    },
    L55: {
      code: 'L55',
      label: 'Montant de la TVA — taux normal',
      type: 'calc',
      amount: l55,
      formula: l55Formula,
    },
    L60: {
      code: 'L60',
      label: 'Montant de la TVA brute',
      type: l60Mode === 'collected' ? 'input' : 'calc',
      amount: l60,
      formula: l60Formula,
      source: l60Mode === 'collected' ? 'op_turnovers.tax' : undefined,
    },
    L65: {
      code: 'L65',
      label: 'Affaires soumises au précompte',
      type: 'input',
      amount: l65,
      source: 'manual',
    },
    L70: {
      code: 'L70',
      label: 'Précompte de TVA',
      type: 'input',
      amount: l70,
      source: 'op_retains.amount',
    },
    L75: {
      code: 'L75',
      label: 'Imputation de chèques DDI',
      type: 'input',
      amount: l75,
      source: 'manual (query checksDdi)',
    },
    L76: {
      code: 'L76',
      label: 'Total des avances',
      type: 'calc',
      amount: l76,
      formula: 'L70 + L75',
    },
    L80: {
      code: 'L80',
      label: 'Montant des importations du mois',
      type: 'input',
      amount: l80,
      source: 'op_importations.tax',
    },
    L85: {
      code: 'L85',
      label: 'TVA acquittée sur les importations du mois',
      type: 'input',
      amount: l85,
      source: 'op_importations.taxDeduction|tax',
    },
    L90: {
      code: 'L90',
      label: 'TVA acquittée sur les achats intérieurs du mois',
      type: 'input',
      amount: l90,
      source: 'op_local_purchases.taxDeduction|tax',
    },
    L91: {
      code: 'L91',
      label: 'Déductions sur achats',
      type: 'calc',
      amount: l91,
      formula: 'L85 + L90',
    },
    L92: {
      code: 'L92',
      label: 'Total déductions pour le mois',
      type: 'calc',
      amount: l92,
      formula: 'L76 + L91',
    },
    L93: {
      code: 'L93',
      label: 'Solde intermédiaire avant crédit reporté',
      type: 'calc',
      amount: l93,
      formula: 'L60 − L92',
    },
    L95: {
      code: 'L95',
      label: 'Remboursements demandés et accordés',
      type: 'input',
      amount: l95,
      source: 'manual',
    },
    L100: {
      code: 'L100',
      label: 'Crédit de TVA du mois précédent',
      type: 'input',
      amount: l100,
      source: 'manual (query previousCredit) / L115 N-1',
    },
    L105: {
      code: 'L105',
      label: 'Montant total déductible pour le mois',
      type: 'calc',
      amount: l105,
      formula: 'L70 + L75 + L85 + L90 + L100',
    },
    L110: {
      code: 'L110',
      label: 'Solde total exigible',
      type: 'balance',
      amount: l110,
      formula: 'max(0, L60 − L105)',
    },
    L115: {
      code: 'L115',
      label: 'Crédit de TVA à reporter',
      type: 'balance',
      amount: l115,
      formula: 'max(0, L105 − L60)',
    },
    L120: {
      code: 'L120',
      label: 'Remboursements demandés et en instruction',
      type: 'input',
      amount: l120,
      source: 'manual',
    },
  };

  return {
    rates,
    lines,
    payable: l110,
    creditCarryForward: l115,
  };
}
