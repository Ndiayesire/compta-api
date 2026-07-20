import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ComputeTvaAnnexQueryDto } from './dto/compute-tva-annex.dto';
import { sumCompletedNet, sumRetainAmount, sumTaxDeductionOrTax, toNullableNumber } from './op-amounts';
import { computeTvaAnnex } from './tva-annex.compute';

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
      turnovers,
      exportations,
      exemptions,
      suspensions,
      retains,
      importations,
      localPurchases,
    ] = await Promise.all([
      this.prisma.opTurnover.findMany({
        where: {
          deletedAt: null,
          clientId,
          client: { companyId, deletedAt: null },
          date: { gte: periodStart, lt: periodEnd },
        },
        select: { net: true, tax: true, total: true },
      }),
      this.prisma.opExportation.findMany({
        where: { deletedAt: null, month, year, tier: tierScope },
        select: { net: true, tax: true, total: true },
      }),
      this.prisma.opExemption.findMany({
        where: { deletedAt: null, month, year, tier: tierScope },
        select: { amount: true },
      }),
      this.prisma.opSuspension.findMany({
        where: { deletedAt: null, month, year, tier: tierScope },
        select: { net: true, tax: true, total: true },
      }),
      this.prisma.opRetain.findMany({
        where: { deletedAt: null, month, year, tier: tierScope },
        select: { amount: true, base: true, rate: true },
      }),
      this.prisma.opImportation.findMany({
        where: { deletedAt: null, month, year, tier: tierScope },
        select: { net: true, tax: true, total: true, taxDeduction: true },
      }),
      this.prisma.opLocalPurchase.findMany({
        where: { deletedAt: null, month, year, tier: tierScope },
        select: { net: true, tax: true, total: true, taxDeduction: true },
      }),
    ]);

    const turnoverNet = sumCompletedNet(turnovers);
    const l10 = sumCompletedNet(exportations);
    const l15 = Math.round(
      exemptions.reduce((acc, row) => acc + (toNullableNumber(row.amount) ?? 0), 0),
    );
    /** L5 = Σ CA HT + Σ exonérations (= CA + L15) */
    const l5 = Math.round(turnoverNet + l15);
    const l20 = sumCompletedNet(suspensions);
    const l70 = sumRetainAmount(retains);
    const l80 = sumCompletedNet(importations);
    const l85 = sumTaxDeductionOrTax(importations);
    const l90 = sumTaxDeductionOrTax(localPurchases);

    const reducedRate = query.reducedRate ?? 10;
    const normalRate = client.country?.tva ?? 18;

    const annex = computeTvaAnnex(
      {
        l5,
        l10,
        l15,
        l20,
        l30: query.selfSupplies ?? 0,
        l40: query.reducedBase ?? 0,
        l65: 0,
        l70,
        l75: query.checksDdi ?? 0,
        l80,
        l85,
        l90,
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
        ninea: client.ninea,
        useTva: client.useTva,
        countryId: client.countryId,
        countryTva: normalRate,
      },
      rates: annex.rates,
      sources: {
        turnovers: { count: turnovers.length, sumNet: turnoverNet },
        exportations: { count: exportations.length, sumNet: l10 },
        exemptions: { count: exemptions.length, sumAmount: l15 },
        suspensions: { count: suspensions.length, sumNet: l20 },
        retains: { count: retains.length, sumAmount: l70 },
        importations: {
          count: importations.length,
          sumNet: l80,
          usedForL85: l85,
        },
        localPurchases: {
          count: localPurchases.length,
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
