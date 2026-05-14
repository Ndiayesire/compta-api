import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTierDto } from './dto/create-tier.dto';
import { UpdateTierDto } from './dto/update-tier.dto';
import { EtatAnnuelSommesVerseesExcelService } from '../excel-reports/services/etat-annuel-sommes-versees-excel.service';
import { EtatTrimestrielSommesVerseesExcelService } from '../excel-reports/services/etat-trimestriel-sommes-versees-excel.service';
import { TIER_EXPORT_INCLUDE } from './tiers-export.include';
import { buildSenegalAnnualFormData, buildSenegalQuarterlyFormData } from './tiers-senegal-form.data';
import type { EtatAnnuelSommesVerseesFormData } from '../excel-reports/types/etat-annuel-sommes-versees.types';
import type { EtatTrimestrielSommesVerseesFormData } from '../excel-reports/types/etat-trimestriel-sommes-versees.types';
import { saveTierExcelToGenerations } from './tiers-generations.util';

const tierInclude = {
  tierType: true,
  client: true,
} satisfies Prisma.TierInclude;

@Injectable()
export class TiersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly etatTrimestrielSommesVerseesExcel: EtatTrimestrielSommesVerseesExcelService,
    private readonly etatAnnuelSommesVerseesExcel: EtatAnnuelSommesVerseesExcelService,
  ) {}

  private async assertClientInCompany(clientId: string, companyId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, companyId, deletedAt: null },
    });
    if (!client) {
      throw new BadRequestException(
        'Client not found or does not belong to your company',
      );
    }
    return client;
  }

  private async assertTierTypeExists(tierTypeId: string) {
    const tt = await this.prisma.tierType.findUnique({
      where: { id: tierTypeId },
    });
    if (!tt) {
      throw new BadRequestException('Invalid tier type');
    }
    return tt;
  }

  async create(dto: CreateTierDto, companyId: string) {
    await this.assertClientInCompany(dto.clientId, companyId);
    await this.assertTierTypeExists(dto.tierTypeId);

    return this.prisma.tier.create({
      data: {
        tierTypeId: dto.tierTypeId,
        clientId: dto.clientId,
        name: dto.name,
        ninea: dto.ninea,
        useTva: dto.useTva ?? true,
        reference: dto.reference,
        meta: (dto.meta ?? {}) as Prisma.InputJsonValue,
        isActive: dto.isActive ?? true,
      },
      include: tierInclude,
    });
  }

  async findAll(companyId: string) {
    return this.prisma.tier.findMany({
      where: {
        deletedAt: null,
        client: { companyId, deletedAt: null },
      },
      include: tierInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByClient(clientId: string, companyId: string) {
    await this.assertClientInCompany(clientId, companyId);

    return this.prisma.tier.findMany({
      where: {
        clientId,
        deletedAt: null,
      },
      include: tierInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const tier = await this.prisma.tier.findFirst({
      where: {
        id,
        deletedAt: null,
        client: { companyId, deletedAt: null },
      },
      include: tierInclude,
    });

    if (!tier) {
      throw new NotFoundException('Tier not found');
    }

    return tier;
  }

  private async findClientForExport(clientId: string, companyId: string) {
    const client = await this.prisma.client.findFirst({
      where: {
        id: clientId,
        companyId,
        deletedAt: null,
      },
      include: {
        country: true,
        region: true,
        legalForm: true,
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  async update(id: string, dto: UpdateTierDto, companyId: string) {
    await this.findOne(id, companyId);

    if (dto.clientId) {
      await this.assertClientInCompany(dto.clientId, companyId);
    }
    if (dto.tierTypeId) {
      await this.assertTierTypeExists(dto.tierTypeId);
    }

    const {
      tierTypeId,
      clientId,
      meta,
      ...rest
    } = dto;

    const data: Prisma.TierUpdateInput = {
      ...rest,
      ...(meta !== undefined
        ? { meta: meta as Prisma.InputJsonValue }
        : {}),
      ...(tierTypeId !== undefined
        ? { tierType: { connect: { id: tierTypeId } } }
        : {}),
      ...(clientId !== undefined
        ? { client: { connect: { id: clientId } } }
        : {}),
    };

    return this.prisma.tier.update({
      where: { id },
      data,
      include: tierInclude,
    });
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);

    return this.prisma.tier.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async buildTierExportFormData(
    clientId: string,
    companyId: string,
    accountingYearId: string,
    accountingQuarterId: string,
  ): Promise<EtatTrimestrielSommesVerseesFormData> {
    const client = await this.findClientForExport(clientId, companyId);
    const anchor = await this.prisma.tier.findFirst({
      where: {
        clientId,
        deletedAt: null,
        client: { companyId, deletedAt: null },
      },
      include: TIER_EXPORT_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
    const quarter = await this.prisma.accountingQuarter.findFirst({
      where: {
        id: accountingQuarterId,
        accountingYearId,
        deletedAt: null,
        accountingYear: {
          id: accountingYearId,
          deletedAt: null,
        },
      },
      include: { accountingYear: true },
    });
    if (!quarter) {
      throw new BadRequestException(
        'Accounting quarter not found for provided accounting year',
      );
    }

    const tierLines = await this.prisma.tier.findMany({
      where: {
        clientId,
        deletedAt: null,
        client: { companyId, deletedAt: null },
      },
      select: { id: true, name: true, ninea: true, meta: true },
      orderBy: { createdAt: 'asc' },
    });

    const tierIds = tierLines.map((t) => t.id);
    const sumsByTier = await this.prisma.tiersTransaction.groupBy({
      by: ['tierId'],
      where: {
        deletedAt: null,
        tierId: { in: tierIds },
        date: {
          gte: quarter.monthStartDate,
          lte: quarter.endDate,
        },
      },
      _sum: {
        total: true,
        tax: true,
      },
    });

    const sumsByTierId = new Map(
      sumsByTier.map((s) => [
        s.tierId,
        {
          montantVerse: s._sum.total ?? 0,
          irRetenu: s._sum.tax ?? 0,
        },
      ]),
    );
    return buildSenegalQuarterlyFormData(
      client,
      anchor?.meta,
      quarter,
      tierLines,
      sumsByTierId,
    );
  }

  private async buildTierAnnualExportFormData(
    clientId: string,
    companyId: string,
    accountingYearId: string,
  ): Promise<EtatAnnuelSommesVerseesFormData> {
    const client = await this.findClientForExport(clientId, companyId);
    const anchor = await this.prisma.tier.findFirst({
      where: {
        clientId,
        deletedAt: null,
        client: { companyId, deletedAt: null },
      },
      include: TIER_EXPORT_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
    const year = await this.prisma.accountingYear.findFirst({
      where: {
        id: accountingYearId,
        deletedAt: null,
      },
    });
    if (!year) {
      throw new BadRequestException('Accounting year not found');
    }

    const tierLines = await this.prisma.tier.findMany({
      where: {
        clientId,
        deletedAt: null,
        client: { companyId, deletedAt: null },
      },
      select: { id: true, name: true, ninea: true, meta: true },
      orderBy: { createdAt: 'asc' },
    });

    const tierIds = tierLines.map((t) => t.id);
    const sumsByTier = await this.prisma.tiersTransaction.groupBy({
      by: ['tierId'],
      where: {
        deletedAt: null,
        tierId: { in: tierIds },
        date: {
          gte: year.startDate,
          lte: year.endDate,
        },
      },
      _sum: {
        total: true,
        tax: true,
      },
    });

    const sumsByTierId = new Map(
      sumsByTier.map((s) => [
        s.tierId,
        {
          montantVerse: s._sum.total ?? 0,
          irRetenu: s._sum.tax ?? 0,
        },
      ]),
    );

    return buildSenegalAnnualFormData(
      client,
      anchor?.meta,
      year,
      tierLines,
      sumsByTierId,
    );
  }

  private buildExportFilenameBase(trimestreLibelle: string, clientName: string): string {
    const safe = (value: string) =>
      (value ?? '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9-_]/g, '')
        .toLowerCase();

    const quarterPart = safe(trimestreLibelle);
    const clientPart = safe(clientName);
    return `etat-${quarterPart}-${clientPart}`;
  }

  async renderTierExcel(
    clientId: string,
    companyId: string,
    accountingYearId: string,
    accountingQuarterId: string,
  ) {
    const data = await this.buildTierExportFormData(
      clientId,
      companyId,
      accountingYearId,
      accountingQuarterId,
    );
    const filenameBase = this.buildExportFilenameBase(
      data.trimestreLibelle,
      data.declarant.raisonSociale,
    );
    const buffer =
      await this.etatTrimestrielSommesVerseesExcel.fillWorkbook(data);
    saveTierExcelToGenerations(buffer, filenameBase);
    return {
      buffer,
      filenameBase,
    };
  }

  async renderTierAnnualExcel(clientId: string, companyId: string, accountingYearId: string) {
    const data = await this.buildTierAnnualExportFormData(
      clientId,
      companyId,
      accountingYearId,
    );
    const filenameBase = this.buildExportFilenameBase(
      `annuel-${data.periodeAnnuelleLibelle}`,
      data.declarant.raisonSociale,
    );
    const buffer = await this.etatAnnuelSommesVerseesExcel.fillWorkbook(data);
    saveTierExcelToGenerations(buffer, filenameBase);
    return {
      buffer,
      filenameBase,
    };
  }
}
