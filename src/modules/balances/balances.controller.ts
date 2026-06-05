import { BadRequestException, Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UsePipes, ValidationPipe, Query, UseInterceptors, UploadedFile, ParseUUIDPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth, ApiQuery, ApiBody, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { BalancesService } from './balances.service';
import { CreateBalanceDto } from './dto/create-balance.dto';
import { UpdateBalanceDto } from './dto/update-balance.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { API_ENVELOPE_SCHEMA } from '../../common/swagger/api-envelope.schema';

type BalanceLineImportUploadedFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
};

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

@ApiTags('balances')
@ApiBearerAuth('JWT')
@Controller('balances')
export class BalancesController {
  constructor(private readonly balancesService: BalancesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'CrÃ©er une balance',
    description:
      'Lie `accounting_year_id` + `client_id` (client de la sociÃ©tÃ© JWT). Les dates `startDate` / `endDate` doivent Ãªtre **strictement** dans lâ€™exercice et `startDate < endDate`.',
  })
  @ApiBody({ type: CreateBalanceDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    schema: API_ENVELOPE_SCHEMA,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Client hors sociÃ©tÃ©, exercice inconnu, dates invalides, ou sans sociÃ©tÃ©',
  })
  async create(@Body() dto: CreateBalanceDto, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const data = await this.balancesService.createBalance(dto, companyId);
    return {
      success: true,
      message: 'Balance created successfully',
      data,
    };
  }

  @Post(':balanceId/balance-lines/import')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiTags('balances', 'balance-lines')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Importer des lignes de balance depuis Excel (.xlsx)',
    description: [
      '**Multipart** : champ **`file`** (`.xlsx`, max 5 Mo). **`balanceId`** dans lâ€™URL â€” **aucune colonne balance_id** dans le fichier.',
      '',
      '**Feuille** : 1Ê³áµ‰ feuille, **ligne 1 = 8 en-tÃªtes** (noms reconnus par synonymes, **ordre des colonnes libre**). DonnÃ©es Ã  partir de la ligne 2 ; lignes vides ignorÃ©es ; max **500** lignes utiles.',
      '',
      '**Les 8 colonnes** (ex. balance auxiliaire) : `NumÃ©ro de compte`, `LibellÃ©`, `DÃ©bit N-1`, `CrÃ©dit N-1`, `Mouvement dÃ©bit`, `Mouvement crÃ©dit`, `DÃ©bit N`, `CrÃ©dit N` â€” abrÃ©viations encore acceptÃ©es (`cpte`, `MVT DEB`, â€¦) ; ordre libre.',
      'Les paires **DÃ©bit N-1 / CrÃ©dit N-1** et **DÃ©bit N / CrÃ©dit N** dÃ©terminent le solde net et le sens (dÃ©biteur si dÃ©bit > crÃ©dit). Montants vides = 0.',
      '',
      '**Remarque** : lâ€™identifiant de balance est **uniquement** dans lâ€™URL (jamais dans le fichier). Dans les cellules montant, les **espaces** (sÃ©parateurs de milliers) et la **virgule** dÃ©cimale sont acceptÃ©s. Le fichier modÃ¨le dâ€™exemple comporte des **infobulles** (notes Excel) sur chaque en-tÃªte : survolez la cellule pour lire lâ€™aide. ModÃ¨le : `src/assets/xlsx/balance-lines-import-example.xlsx` (rÃ©gÃ©nÃ©rer avec `npm run generate:balance-lines-import-example`).',
    ].join('\n'),
  })
  @ApiParam({
    name: 'balanceId',
    description: 'UUID de la balance (client de votre sociÃ©tÃ©)',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Classeur .xlsx',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Import : compteurs + lignes crÃ©Ã©es + erreurs par nÂ° de ligne Excel',
    schema: API_ENVELOPE_SCHEMA,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Fichier manquant / invalide, en-tÃªtes incomplets, balance hors sociÃ©tÃ©',
  })
  async importBalanceLines(
    @Param('balanceId', ParseUUIDPipe) balanceId: string,
    @UploadedFile() file: BalanceLineImportUploadedFile | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    if (!file?.buffer?.length) {
      throw new BadRequestException(
        'Fichier Excel requis (multipart, champ `file`)',
      );
    }
    const nameOk = /\.xlsx$/i.test(file.originalname ?? '');
    const mimeOk =
      file.mimetype === XLSX_MIME ||
      file.mimetype === 'application/octet-stream' ||
      nameOk;
    if (!mimeOk) {
      throw new BadRequestException(
        `Fichier .xlsx attendu (MIME ${XLSX_MIME} ou extension .xlsx)`,
      );
    }
    const data = await this.balancesService.importBalanceLinesFromExcel(
      balanceId,
      companyId,
      file.buffer,
    );
    return {
      success: true,
      message: `Import lignes de balance : ${data.createdCount} crÃ©Ã©e(s), ${data.failedCount} ligne(s) en erreur`,
      data,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Lister les balances de la sociÃ©tÃ©',
    description: 'Filtre optionnel par `clientId` (UUID client de votre sociÃ©tÃ©).',
  })
  @ApiQuery({
    name: 'clientId',
    required: false,
    description: 'UUID client',
    example: 'a0000021-0000-4000-8000-000000000001',
  })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Utilisateur sans sociÃ©tÃ©',
  })
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query('clientId') clientId?: string,
  ) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const data = await this.balancesService.findAllBalances(
      companyId,
      clientId,
    );
    return {
      success: true,
      message: 'Balances retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'DÃ©tail dâ€™une balance' })
  @ApiParam({ name: 'id', description: 'UUID `balance_id`', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Inconnue ou hors sociÃ©tÃ©' })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const data = await this.balancesService.findOneBalance(id, companyId);
    return {
      success: true,
      message: 'Balance retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Mettre Ã  jour une balance',
    description:
      'Champs partiels : dates, `isActive`. Lâ€™exercice et le client ne changent pas. Les dates restent dans lâ€™exercice dâ€™origine.',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateBalanceDto })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Inconnue' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dates invalides' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBalanceDto,
    @CurrentUser() user: AuthUser,
  ) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const data = await this.balancesService.updateBalance(id, dto, companyId);
    return {
      success: true,
      message: 'Balance updated successfully',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer une balance (soft) et ses lignes',
    description:
      'Met `balance_deleted_at` et `balance_line_deleted_at` sur les lignes encore actives, en transaction.',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Inconnue' })
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const data = await this.balancesService.removeBalance(id, companyId);
    return {
      success: true,
      message: 'Balance deleted successfully',
      data,
    };
  }
}
