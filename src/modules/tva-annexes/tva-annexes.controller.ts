import { BadRequestException, Controller, Get, Header, HttpStatus, Query, Res, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { API_ENVELOPE_SCHEMA } from '../../common/swagger/api-envelope.schema';
import { ComputeTvaAnnexQueryDto } from './dto/compute-tva-annex.dto';
import { TvaAnnexesService } from './tva-annexes.service';
import { buildTvaAnnexPdf } from './tva-annex-pdf.service';

const SHARED_QUERIES = [
  { name: 'clientId',       required: true,  schema: { type: 'string',  format: 'uuid' } },
  { name: 'month',          required: true,  schema: { type: 'integer', minimum: 1, maximum: 12 } },
  { name: 'year',           required: true,  schema: { type: 'integer', example: 2025 } },
  { name: 'reducedBase',    required: false, schema: { type: 'number',  default: 0 } },
  { name: 'previousCredit', required: false, schema: { type: 'number',  default: 0 } },
  { name: 'checksDdi',      required: false, schema: { type: 'number',  default: 0 } },
  { name: 'selfSupplies',   required: false, schema: { type: 'number',  default: 0 } },
  { name: 'reducedRate',    required: false, schema: { type: 'number',  default: 10 } },
] as const;

const DESC_COMMON = [
  'Agrège les opérations fiscales du **client** pour `month` / `year`, puis applique les formules L5–L115.',
  '',
  '**Préalable** : chaque ligne `op_*` passe par la complétion du triplet `total = net + tax` avant agrégation.',
  '',
  '**Sources automatiques** :',
  '- **L5** `op_turnovers.net` (complété ; filtre `date` du mois)',
  '- **L10** `op_exportations.net` (complété)',
  '- **L15** `op_exemptions.amount`',
  '- **L20** `op_suspensions.net` (complété)',
  '- **L50 / L55 / L60** `L40×10%`, `L45×taux_pays%`, `L50+L55`',
  '- **L70** `op_retains.amount` (ou `base×rate/100`)',
  '- **L80** `op_importations.net` (complété)',
  '- **L85** `op_importations.taxDeduction` sinon `tax`',
  '- **L90** `op_local_purchases.taxDeduction` sinon `tax`',
  '',
  '**Overrides query** : `reducedBase` (L40), `previousCredit` (L100), `checksDdi` (L75), `selfSupplies` (L30), `reducedRate`.',
  '',
  '**Taux normal** : `client.country.tva` (ex. 18). Taux réduit défaut **10 %**.',
  '',
  '**Soldes** : `payable` = L110 ; `creditCarryForward` = L115 (à reporter en L100 du mois suivant).',
].join('\n');

@ApiTags('tva-annexes')
@ApiBearerAuth('JWT')
@Controller('tva-annexes')
export class TvaAnnexesController {
  constructor(private readonly tvaAnnexesService: TvaAnnexesService) {}

  @Get('compute')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Calculer l\u2019annexe fiscale TVA pour un mois (JSON)', description: DESC_COMMON })
  @ApiQuery(SHARED_QUERIES[0]) @ApiQuery(SHARED_QUERIES[1]) @ApiQuery(SHARED_QUERIES[2])
  @ApiQuery(SHARED_QUERIES[3]) @ApiQuery(SHARED_QUERIES[4]) @ApiQuery(SHARED_QUERIES[5])
  @ApiQuery(SHARED_QUERIES[6]) @ApiQuery(SHARED_QUERIES[7])
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async compute(@Query() query: ComputeTvaAnnexQueryDto, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    const data = await this.tvaAnnexesService.compute(companyId, query);
    return {
      success: true,
      message: `Annexe TVA ${String(query.month).padStart(2, '0')}/${query.year} calc\u00e9e`,
      data,
    };
  }

  @Get('compute/pdf')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @Header('Content-Type', 'application/pdf')
  @ApiOperation({
    summary: 'G\u00e9n\u00e9rer la d\u00e9claration TVA au format PDF (DGID)',
    description: DESC_COMMON + '\n\nRetourne un **PDF** au format de la d\u00e9claration DGID S\u00e9n\u00e9gal (L5\u2013L120).',
  })
  @ApiQuery(SHARED_QUERIES[0]) @ApiQuery(SHARED_QUERIES[1]) @ApiQuery(SHARED_QUERIES[2])
  @ApiQuery(SHARED_QUERIES[3]) @ApiQuery(SHARED_QUERIES[4]) @ApiQuery(SHARED_QUERIES[5])
  @ApiQuery(SHARED_QUERIES[6]) @ApiQuery(SHARED_QUERIES[7])
  @ApiResponse({ status: HttpStatus.OK, description: 'Fichier PDF de la d\u00e9claration TVA', content: { 'application/pdf': {} } })
  async computePdf(
    @Query() query: ComputeTvaAnnexQueryDto,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const companyId = user.companyId;
    if (!companyId) throw new BadRequestException('User must belong to a company');

    const data = await this.tvaAnnexesService.compute(companyId, query);

    const pdf = await buildTvaAnnexPdf(
      {
        ninea:        data.client.ninea ?? '',
        companyName:  data.client.name,
        centreFiscal: '',
        month: query.month,
        year:  query.year,
      },
      {
        rates:              data.rates,
        lines:              data.lines,
        payable:            data.payable,
        creditCarryForward: data.creditCarryForward,
      },
    );

    const filename = `declaration-tva-${String(query.month).padStart(2, '0')}-${query.year}.pdf`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdf.length);
    res.end(pdf);
  }
}
