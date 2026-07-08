import { computeTvaAnnex } from './tva-annex.compute';

describe('computeTvaAnnex', () => {
  it('matches the illustrative example from processus_calcul_tva.md', () => {
    const result = computeTvaAnnex(
      {
        l5: 10_000_000,
        l10: 1_000_000,
        l15: 500_000,
        l20: 500_000,
        l30: 0,
        l40: 1_000_000,
        l65: 0,
        l70: 50_000,
        l75: 0,
        l80: 0,
        l85: 200_000,
        l90: 400_000,
        l95: 0,
        l100: 0,
        l120: 0,
      },
      { reducedRate: 10, normalRate: 18 },
    );

    expect(result.lines.L25.amount).toBe(2_000_000);
    expect(result.lines.L35.amount).toBe(8_000_000);
    expect(result.lines.L45.amount).toBe(7_000_000);
    expect(result.lines.L50.amount).toBe(100_000);
    expect(result.lines.L55.amount).toBe(1_260_000);
    expect(result.lines.L60.amount).toBe(1_360_000);
    expect(result.lines.L105.amount).toBe(650_000);
    expect(result.payable).toBe(710_000);
    expect(result.creditCarryForward).toBe(0);
    expect(result.lines.L110.amount).toBe(710_000);
    expect(result.lines.L115.amount).toBe(0);
  });

  it('produces a carry-forward credit when deductions exceed VAT due', () => {
    const result = computeTvaAnnex(
      {
        l5: 1_000_000,
        l10: 0,
        l15: 0,
        l20: 0,
        l30: 0,
        l40: 0,
        l65: 0,
        l70: 0,
        l75: 0,
        l80: 0,
        l85: 100_000,
        l90: 200_000,
        l95: 0,
        l100: 0,
        l120: 0,
      },
      { reducedRate: 10, normalRate: 18 },
    );

    // L55 = 1_000_000 × 18% = 180_000 ; L105 = 300_000 → crédit 120_000
    expect(result.lines.L60.amount).toBe(180_000);
    expect(result.payable).toBe(0);
    expect(result.creditCarryForward).toBe(120_000);
  });
});
