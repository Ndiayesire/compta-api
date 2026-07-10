import { BadRequestException, Controller, Get, HttpStatus, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { API_ENVELOPE_SCHEMA } from '../../common/swagger/api-envelope.schema';
import { ComputeTvaAnnexQueryDto } from './dto/compute-tva-annex.dto';
import { TvaAnnexesService } from './tva-annexes.service';

@ApiTags('tva-annexes')
@ApiBearerAuth('JWT')
@Controller('tva-annexes')
export class TvaAnnexesController {
  constructor(private readonly tvaAnnexesService: TvaAnnexesService) {}

  @Get('compute')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Calculer l’annexe fiscale TVA pour un mois',
    description: [
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
    ].join('\n'),
  })
  @ApiQuery({ name: 'clientId', required: true, schema: { type: 'string', format: 'uuid' } })
  @ApiQuery({ name: 'month', required: true, schema: { type: 'integer', minimum: 1, maximum: 12 } })
  @ApiQuery({ name: 'year', required: true, schema: { type: 'integer', example: 2025 } })
  @ApiQuery({ name: 'reducedBase', required: false, schema: { type: 'number', default: 0 } })
  @ApiQuery({ name: 'previousCredit', required: false, schema: { type: 'number', default: 0 } })
  @ApiQuery({ name: 'checksDdi', required: false, schema: { type: 'number', default: 0 } })
  @ApiQuery({ name: 'selfSupplies', required: false, schema: { type: 'number', default: 0 } })
  @ApiQuery({ name: 'reducedRate', required: false, schema: { type: 'number', default: 10 } })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async compute(@Query() query: ComputeTvaAnnexQueryDto, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    const data = await this.tvaAnnexesService.compute(companyId, query);
    return {
      success: true,
      message: `Annexe TVA ${String(query.month).padStart(2, '0')}/${query.year} calculée`,
      data,
    };
  }
}
