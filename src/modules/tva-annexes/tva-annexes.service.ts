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

function pickTaxDeduction(taxDeduction: number, tax: number): number {
  return taxDeduction > 0 ? taxDeduction : tax;
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
        _sum: { tax: true },
        _count: true,
      }),
      this.prisma.opExportation.aggregate({
        where: {
          deletedAt: null,
          month,
          year,
          tier: tierScope,
        },
        _sum: { tax: true },
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
        _sum: { tax: true },
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
        _sum: { tax: true, taxDeduction: true },
        _count: true,
      }),
      this.prisma.opLocalPurchase.aggregate({
        where: {
          deletedAt: null,
          month,
          year,
          tier: tierScope,
        },
        _sum: { tax: true, taxDeduction: true },
        _count: true,
      }),
    ]);

    const turnoverTax = dec(turnoverAgg._sum.tax);
    const importTax = dec(importationAgg._sum.tax);
    const importTaxDeduction = dec(importationAgg._sum.taxDeduction);
    const localTax = dec(localPurchaseAgg._sum.tax);
    const localTaxDeduction = dec(localPurchaseAgg._sum.taxDeduction);
    const l85 = pickTaxDeduction(importTaxDeduction, importTax);
    const l90 = pickTaxDeduction(localTaxDeduction, localTax);

    const reducedRate = query.reducedRate ?? 10;
    const normalRate = client.country?.tva ?? 18;

    const annex = computeTvaAnnex(
      {
        l5: turnoverTax,
        l10: dec(exportAgg._sum.tax),
        l15: dec(exemptionAgg._sum.amount),
        l20: dec(suspensionAgg._sum.tax),
        l30: query.selfSupplies ?? 0,
        l40: query.reducedBase ?? 0,
        l65: 0,
        l70: dec(retainAgg._sum.amount),
        l75: query.checksDdi ?? 0,
        l80: importTax,
        l85,
        l90,
        l95: 0,
        l100: query.previousCredit ?? 0,
        l120: 0,
        l60TurnoverTax: turnoverTax,
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
        turnovers: { count: turnoverAgg._count, sumTax: turnoverTax },
        exportations: { count: exportAgg._count, sumTax: dec(exportAgg._sum.tax) },
        exemptions: { count: exemptionAgg._count, sumAmount: dec(exemptionAgg._sum.amount) },
        suspensions: { count: suspensionAgg._count, sumTax: dec(suspensionAgg._sum.tax) },
        retains: { count: retainAgg._count, sumAmount: dec(retainAgg._sum.amount) },
        importations: {
          count: importationAgg._count,
          sumTax: importTax,
          sumTaxDeduction: importTaxDeduction,
          usedForL80: importTax,
          usedForL85: l85,
        },
        localPurchases: {
          count: localPurchaseAgg._count,
          sumTax: localTax,
          sumTaxDeduction: localTaxDeduction,
          usedForL90: l90,
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
