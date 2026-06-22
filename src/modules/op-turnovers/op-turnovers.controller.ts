import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UploadedFile, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth, ApiQuery, ApiBody, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { OpTurnoversService } from './op-turnovers.service';
import { CreateOpTurnoverDto } from './dto/create-op-turnover.dto';
import { UpdateOpTurnoverDto } from './dto/update-op-turnover.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { API_ENVELOPE_SCHEMA } from '../../common/swagger/api-envelope.schema';
import { OP_TURNOVER_IMPORT_RESPONSE_SCHEMA } from './swagger/op-turnover-import-response.schema';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

type TurnoverImportUploadedFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
};

@ApiTags('op-turnovers')
@ApiBearerAuth('JWT')
@Controller('op-turnovers')
export class OpTurnoversController {
  constructor(private readonly opTurnoversService: OpTurnoversService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Créer un chiffre d’affaires (op_turnover)' })
  @ApiBody({ type: CreateOpTurnoverDto })
  @ApiResponse({ status: HttpStatus.CREATED, schema: API_ENVELOPE_SCHEMA })
  async create(@Body() dto: CreateOpTurnoverDto, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    const data = await this.opTurnoversService.create(dto, companyId);
    return { success: true, message: 'Op turnover created successfully', data };
  }

  @Post('import')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Importer des chiffres d’affaires depuis Excel (.xlsx)',
    description: [
      '**Requête** : `multipart/form-data` avec le champ **`file`** (`.xlsx`, max 5 Mo). **Query obligatoire** : `clientId` (UUID du client) — doit appartenir à la **société du JWT**.',
      '',
      '**Feuille** : 1ʳᵉ feuille. **Ligne 1** = en-têtes (ordre libre) :',
      '`DATES`, `N° FACTURE`, `LIBELLES`, `MONTANT HT`, `TVA`, `TTC`.',
      '',
      '**Mapping** : `DATES` → `date` ; `N° FACTURE` → `number` ; `MONTANT HT` → `net` ; `TVA` → `tax` ; `TTC` → `total` (ou `net` + `tax` si absent).',
      '**LIBELLES** : colonne informative du modèle — **non persistée** en base (`op_turnovers` n’a pas de libellé).',
      '',
      'Modèle : `src/assets/xlsx/turnovers-import-template.xlsx`. Max **500** lignes utiles.',
    ].join('\n'),
  })
  @ApiQuery({
    name: 'clientId',
    required: true,
    description: 'UUID du client — chaque ligne est rattachée à ce client.',
    schema: { type: 'string', format: 'uuid' },
    example: 'a0000021-0000-4000-8000-000000000001',
  })
  @ApiBody({
    description: 'Corps **multipart** : partie **`file`** (fichier `.xlsx`).',
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'Classeur Excel Open XML (.xlsx)' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Import exécuté : compteurs et détail des créations / erreurs.',
    schema: OP_TURNOVER_IMPORT_RESPONSE_SCHEMA,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Fichier absent, client hors société JWT ou en-têtes Excel incomplets.',
  })
  async importFromExcel(
    @UploadedFile() file: TurnoverImportUploadedFile | undefined,
    @Query('clientId') clientId: string,
    @CurrentUser() user: AuthUser,
  ) {
    if (!clientId?.trim()) {
      throw new BadRequestException('Query clientId is required');
    }
    if (!file?.buffer?.length) {
      throw new BadRequestException('File is required (multipart field "file")');
    }
    const isXlsx =
      file.mimetype === XLSX_MIME || file.originalname?.toLowerCase().endsWith('.xlsx');
    if (!isXlsx) {
      throw new BadRequestException('Only .xlsx files are accepted');
    }
    const companyId = user.companyId ?? user.company?.id;
    if (!companyId) {
      throw new BadRequestException('User company context is required');
    }
    const data = await this.opTurnoversService.importFromExcelBuffer(
      file.buffer,
      companyId,
      clientId,
    );
    return {
      success: true,
      message: `Import chiffres d'affaires : ${data.createdCount} créé(s), ${data.failedCount} ligne(s) en erreur`,
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Lister les chiffres d’affaires de la société' })
  @ApiQuery({ name: 'clientId', required: false, type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findAll(@CurrentUser() user: AuthUser, @Query('clientId') clientId?: string) {
    const companyId = user.companyId;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    const data = await this.opTurnoversService.findAll(companyId, clientId);
    return { success: true, message: 'Op turnovers retrieved successfully', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’un chiffre d’affaires' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    const data = await this.opTurnoversService.findOne(id, companyId);
    return { success: true, message: 'Op turnover retrieved successfully', data };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Mettre à jour un chiffre d’affaires' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateOpTurnoverDto })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async update(@Param('id') id: string, @Body() dto: UpdateOpTurnoverDto, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    const data = await this.opTurnoversService.update(id, dto, companyId);
    return { success: true, message: 'Op turnover updated successfully', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un chiffre d’affaires (soft delete)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    const data = await this.opTurnoversService.remove(id, companyId);
    return { success: true, message: 'Op turnover deleted successfully', data };
  }
}
