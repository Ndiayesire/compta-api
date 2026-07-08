import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ComputeTvaAnnexQueryDto } from './dto/compute-tva-annex.dto';
import { computeTvaAnnex } from './tva-annex.compute';

function dec(value: Prisma.Decimal | number | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  return value.toNumber();
}

@Injectable()
export class TvaAnnexesService {
  constructor(private readonly prisma: PrismaService) {}

  async compute(companyId: string, query: ComputeTvaAnnexQueryDto) {
    const { clientId, month, year } = query;

    const client = await this.prisma.client.findFirst({
      where: { id: clientId, companyId, deletedAt: null },
      include: { country: true },
    });
    if (!client) {
      throw new NotFoundException('Client not found for this company');
    }

    const periodStart = new Date(Date.UTC(year, month - 1, 1));
    const periodEnd = new Date(Date.UTC(year, month, 1));

    const tierScope = {
      deletedAt: null as null,
      clientId,
      client: { companyId, deletedAt: null },
    };

    const [
      turnoverAgg,
      exportAgg,
      exemptionAgg,
      suspensionAgg,
      retainAgg,
      importationAgg,
      localPurchaseAgg,
    ] = await Promise.all([
      this.prisma.opTurnover.aggregate({
        where: {
          deletedAt: null,
          clientId,
          client: { companyId, deletedAt: null },
          date: { gte: periodStart, lt: periodEnd },
        },
        _sum: { net: true },
        _count: true,
      }),
      this.prisma.opExportation.aggregate({
        where: {
          deletedAt: null,
          month,
          year,
          tier: tierScope,
        },
        _sum: { net: true },
        _count: true,
      }),
      this.prisma.opExemption.aggregate({
        where: {
          deletedAt: null,
          month,
          year,
          tier: tierScope,
        },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.opSuspension.aggregate({
        where: {
          deletedAt: null,
          month,
          year,
          tier: tierScope,
        },
        _sum: { net: true },
        _count: true,
      }),
      this.prisma.opRetain.aggregate({
        where: {
          deletedAt: null,
          month,
          year,
          tier: tierScope,
        },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.opImportation.aggregate({
        where: {
          deletedAt: null,
          month,
          year,
          tier: tierScope,
        },
        _sum: { net: true, tax: true, taxDeduction: true },
        _count: true,
      }),
      this.prisma.opLocalPurchase.aggregate({
        where: {
          deletedAt: null,
          month,
          year,
          tier: tierScope,
        },
        _sum: { taxDeduction: true },
        _count: true,
      }),
    ]);

    const l85TaxDeduction = dec(importationAgg._sum.taxDeduction);
    const l85Tax = dec(importationAgg._sum.tax);
    const l85 = l85TaxDeduction > 0 ? l85TaxDeduction : l85Tax;

    const reducedRate = query.reducedRate ?? 10;
    const normalRate = client.country?.tva ?? 18;

    const annex = computeTvaAnnex(
      {
        l5: dec(turnoverAgg._sum.net),
        l10: dec(exportAgg._sum.net),
        l15: dec(exemptionAgg._sum.amount),
        l20: dec(suspensionAgg._sum.net),
        l30: query.selfSupplies ?? 0,
        l40: query.reducedBase ?? 0,
        l65: 0,
        l70: dec(retainAgg._sum.amount),
        l75: query.checksDdi ?? 0,
        l80: dec(importationAgg._sum.net),
        l85,
        l90: dec(localPurchaseAgg._sum.taxDeduction),
        l95: 0,
        l100: query.previousCredit ?? 0,
        l120: 0,
      },
      { reducedRate, normalRate },
    );

    return {
      period: { month, year },
      client: {
        id: client.id,
        name: client.name,
        useTva: client.useTva,
        countryId: client.countryId,
        countryTva: normalRate,
      },
      rates: annex.rates,
      sources: {
        turnovers: { count: turnoverAgg._count, sumNet: dec(turnoverAgg._sum.net) },
        exportations: { count: exportAgg._count, sumNet: dec(exportAgg._sum.net) },
        exemptions: { count: exemptionAgg._count, sumAmount: dec(exemptionAgg._sum.amount) },
        suspensions: { count: suspensionAgg._count, sumNet: dec(suspensionAgg._sum.net) },
        retains: { count: retainAgg._count, sumAmount: dec(retainAgg._sum.amount) },
        importations: {
          count: importationAgg._count,
          sumNet: dec(importationAgg._sum.net),
          sumTax: l85Tax,
          sumTaxDeduction: l85TaxDeduction,
          usedForL85: l85,
        },
        localPurchases: {
          count: localPurchaseAgg._count,
          sumTaxDeduction: dec(localPurchaseAgg._sum.taxDeduction),
        },
      },
      overrides: {
        reducedBase: query.reducedBase ?? 0,
        previousCredit: query.previousCredit ?? 0,
        checksDdi: query.checksDdi ?? 0,
        selfSupplies: query.selfSupplies ?? 0,
      },
      lines: annex.lines,
      payable: annex.payable,
      creditCarryForward: annex.creditCarryForward,
    };
  }
}
