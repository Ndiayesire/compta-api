import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UploadedFile, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth, ApiQuery, ApiBody, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { OpTurnoverStampsService } from './op-turnover-stamps.service';
import { CreateOpTurnoverStampDto } from './dto/create-op-turnover-stamp.dto';
import { UpdateOpTurnoverStampDto } from './dto/update-op-turnover-stamp.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { API_ENVELOPE_SCHEMA } from '../../common/swagger/api-envelope.schema';
import { OP_TURNOVER_STAMP_IMPORT_RESPONSE_SCHEMA } from './swagger/op-turnover-stamp-import-response.schema';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

type StampImportUploadedFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
};

@ApiTags('op-turnover-stamps')
@ApiBearerAuth('JWT')
@Controller('op-turnover-stamps')
export class OpTurnoverStampsController {
  constructor(private readonly opTurnoverStampsService: OpTurnoverStampsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Créer un timbre / version de CA' })
  @ApiBody({ type: CreateOpTurnoverStampDto })
  @ApiResponse({ status: HttpStatus.CREATED, schema: API_ENVELOPE_SCHEMA })
  async create(@Body() dto: CreateOpTurnoverStampDto, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    const data = await this.opTurnoverStampsService.create(dto, companyId);
    return { success: true, message: 'Op turnover stamp created successfully', data };
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
    summary: 'Importer des timbres CA depuis Excel (.xlsx)',
    description: [
      '**Requête** : `multipart/form-data` avec le champ **`file`** (`.xlsx`, max 5 Mo). **Query obligatoire** : `clientId` — doit appartenir à la **société du JWT**.',
      '',
      '**Feuille** : 1ʳᵉ feuille. **Ligne 1** = en-têtes (ordre libre) :',
      '`DATES`, `N° FACTURE`, `LIBELLES`, `MONTANT TTC`, `TAUX 1%`, `TSE A PAYER`.',
      '',
      '**Résolution CA** : le **N° FACTURE** est recherché dans `op_turnovers` (scope `clientId`).',
      'Si trouvé → `opTurnoverId` renseigné ; sinon → `opTurnoverId` **null**, le timbre est quand même créé.',
      '',
      '**Mapping montants** : `MONTANT TTC` → `total` ; `TSE A PAYER` → `tax` ; `net` = `total` − `tax`.',
      '**LIBELLES** → libellé dans `amount.lines` ; **TAUX 1%** → `amountDeduction.lines`.',
      '',
      'Modèle : `src/assets/xlsx/stamps-import-template.xlsx`. Max **500** lignes utiles.',
    ].join('\n'),
  })
  @ApiQuery({
    name: 'clientId',
    required: true,
    description: 'UUID du client — recherche du N° facture dans les CA de ce client.',
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
    description: 'Import exécuté : compteurs, timbres liés / orphelins, détail des créations / erreurs.',
    schema: OP_TURNOVER_STAMP_IMPORT_RESPONSE_SCHEMA,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Fichier absent, client hors société JWT ou en-têtes Excel incomplets.',
  })
  async importFromExcel(
    @UploadedFile() file: StampImportUploadedFile | undefined,
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
    const data = await this.opTurnoverStampsService.importFromExcelBuffer(
      file.buffer,
      companyId,
      clientId,
    );
    return {
      success: true,
      message: `Import timbres CA : ${data.createdCount} créé(s), ${data.failedCount} ligne(s) en erreur`,
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Lister les timbres d’un chiffre d’affaires' })
  @ApiQuery({ name: 'opTurnoverId', required: true, type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findAll(@Query('opTurnoverId') opTurnoverId: string, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    if (!opTurnoverId) throw new BadRequestException('opTurnoverId query parameter is required');
    const data = await this.opTurnoverStampsService.findAll(opTurnoverId, companyId);
    return { success: true, message: 'Op turnover stamps retrieved successfully', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’un timbre' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    const data = await this.opTurnoverStampsService.findOne(id, companyId);
    return { success: true, message: 'Op turnover stamp retrieved successfully', data };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Mettre à jour un timbre' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateOpTurnoverStampDto })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async update(@Param('id') id: string, @Body() dto: UpdateOpTurnoverStampDto, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    const data = await this.opTurnoverStampsService.update(id, dto, companyId);
    return { success: true, message: 'Op turnover stamp updated successfully', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un timbre (soft delete)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    const data = await this.opTurnoverStampsService.remove(id, companyId);
    return { success: true, message: 'Op turnover stamp deleted successfully', data };
  }
}
