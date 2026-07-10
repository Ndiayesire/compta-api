import {
  completeNetTaxTotal,
  sumCompletedNet,
  sumRetainAmount,
  sumTaxDeductionOrTax,
} from './op-amounts';

describe('completeNetTaxTotal', () => {
  it('derives total from net + tax', () => {
    expect(completeNetTaxTotal({ net: 1_000_000, tax: 180_000, total: null })).toEqual({
      net: 1_000_000,
      tax: 180_000,
      total: 1_180_000,
    });
  });

  it('derives tax from total − net', () => {
    expect(completeNetTaxTotal({ net: 1_000_000, tax: null, total: 1_180_000 })).toEqual({
      net: 1_000_000,
      tax: 180_000,
      total: 1_180_000,
    });
  });

  it('derives net from total − tax', () => {
    expect(completeNetTaxTotal({ net: null, tax: 180_000, total: 1_180_000 })).toEqual({
      net: 1_000_000,
      tax: 180_000,
      total: 1_180_000,
    });
  });

  it('applies stamp 82/18 fallback when only total is known', () => {
    expect(
      completeNetTaxTotal({ net: null, tax: null, total: 1_000_000 }, { stampFallback: true }),
    ).toEqual({
      net: 820_000,
      tax: 180_000,
      total: 1_000_000,
    });
  });

  it('returns null when only one non-total value is known', () => {
    expect(completeNetTaxTotal({ net: 1_000_000, tax: null, total: null })).toBeNull();
  });
});

describe('sum helpers', () => {
  it('sums completed nets', () => {
    expect(
      sumCompletedNet([
        { net: 1_000_000, tax: 180_000, total: null },
        { net: null, tax: 18_000, total: 118_000 },
      ]),
    ).toBe(1_100_000);
  });

  it('prefers taxDeduction over tax', () => {
    expect(
      sumTaxDeductionOrTax([
        { net: 100, tax: 18, taxDeduction: 10, total: 118 },
        { net: 100, tax: 18, taxDeduction: null, total: 118 },
      ]),
    ).toBe(28);
  });

  it('derives retain amount from base × rate', () => {
    expect(sumRetainAmount([{ amount: null, base: 100_000, rate: 5 }])).toBe(5_000);
  });
});
