import {
  BadRequestException,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { API_ENVELOPE_SCHEMA } from '../../common/swagger/api-envelope.schema';
import { ComputeTvaAnnexQueryDto } from './dto/compute-tva-annex.dto';
import { TvaAnnexesService } from './tva-annexes.service';
import { fillTvaAnnexPdf } from './tva-annex-pdf.service';

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
  'Agr\u00e8ge les op\u00e9rations fiscales du **client** pour `month` / `year`, puis applique les formules L5\u2013L115.',
  '',
  '**Pr\u00e9alable** : chaque ligne `op_*` passe par la compl\u00e9tion du triplet `total = net + tax` avant agr\u00e9gation.',
  '',
  '**Sources automatiques** :',
  '- **L5** `op_turnovers.net` (compl\u00e9t\u00e9 ; filtre `date` du mois)',
  '- **L10** `op_exportations.net` (compl\u00e9t\u00e9)',
  '- **L15** `op_exemptions.amount`',
  '- **L20** `op_suspensions.net` (compl\u00e9t\u00e9)',
  '- **L50 / L55 / L60** `L40\u00d710%`, `L45\u00d7taux_pays%`, `L50+L55`',
  '- **L70** `op_retains.amount` (ou `base\u00d7rate/100`)',
  '- **L80** `op_importations.net` (compl\u00e9t\u00e9)',
  '- **L85** `op_importations.taxDeduction` sinon `tax`',
  '- **L90** `op_local_purchases.taxDeduction` sinon `tax`',
  '',
  '**Overrides query** : `reducedBase` (L40), `previousCredit` (L100), `checksDdi` (L75), `selfSupplies` (L30), `reducedRate`.',
  '',
  '**Taux normal** : `client.country.tva` (ex. 18). Taux r\u00e9duit d\u00e9faut **10 %**.',
  '',
  '**Soldes** : `payable` = L110 ; `creditCarryForward` = L115 (\u00e0 reporter en L100 du mois suivant).',
].join('\n');

@ApiTags('tva-annexes')
@ApiBearerAuth('JWT')
@Controller('tva-annexes')
export class TvaAnnexesController {
  constructor(private readonly tvaAnnexesService: TvaAnnexesService) {}

  // ── GET /tva-annexes/compute — JSON ────────────────────────────────────────

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
      message: `Annexe TVA ${String(query.month).padStart(2, '0')}/${query.year} calcul\u00e9e`,
      data,
    };
  }

  // ── POST /tva-annexes/compute/pdf — PDF fill ───────────────────────────────

  @Post('compute/pdf')
  @UseInterceptors(FileInterceptor('file'))
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Remplir le template PDF DGID avec les montants calcul\u00e9s',
    description: [
      DESC_COMMON,
      '',
      'Envoyer le template PDF DGID vierge en tant que **fichier multipart** (`file`).',
      'Seule la **colonne Montant** (L5\u2013L120) est renseign\u00e9e \u2014 le haut du document (NINEA, contribuable, p\u00e9riode\u2026) est laiss\u00e9 intact.',
      'Retourne le PDF rempli en t\u00e9l\u00e9chargement (`Content-Disposition: attachment`).',
    ].join('\n'),
  })
  @ApiQuery(SHARED_QUERIES[0]) @ApiQuery(SHARED_QUERIES[1]) @ApiQuery(SHARED_QUERIES[2])
  @ApiQuery(SHARED_QUERIES[3]) @ApiQuery(SHARED_QUERIES[4]) @ApiQuery(SHARED_QUERIES[5])
  @ApiQuery(SHARED_QUERIES[6]) @ApiQuery(SHARED_QUERIES[7])
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'Template PDF DGID vierge' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'PDF DGID rempli avec les montants calcul\u00e9s',
    content: { 'application/pdf': {} },
  })
  async computePdf(
    @Query() query: ComputeTvaAnnexQueryDto,
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    if (!file) throw new BadRequestException('Un fichier PDF est requis (champ "file")');

    const companyId = user.companyId;
    if (!companyId) throw new BadRequestException('User must belong to a company');

    const data = await this.tvaAnnexesService.compute(companyId, query);

    const pdf = await fillTvaAnnexPdf(file.buffer, {
      rates:              data.rates,
      lines:              data.lines,
      payable:            data.payable,
      creditCarryForward: data.creditCarryForward,
    });

    const filename = `declaration-tva-${String(query.month).padStart(2, '0')}-${query.year}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdf.length);
    res.end(pdf);
  }
}
