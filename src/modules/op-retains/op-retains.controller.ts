import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UploadedFile, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth, ApiQuery, ApiBody, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { OpRetainsService } from './op-retains.service';
import { CreateOpRetainDto } from './dto/create-op-retain.dto';
import { UpdateOpRetainDto } from './dto/update-op-retain.dto';
import { API_ENVELOPE_SCHEMA } from '../../common/swagger/api-envelope.schema';
import { OP_RETAIN_IMPORT_RESPONSE_SCHEMA } from './swagger/op-retain-import-response.schema';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

type RetainImportUploadedFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
};

@ApiTags('op-retains')
@ApiBearerAuth('JWT')
@Controller('op-retains')
export class OpRetainsController {
  constructor(private readonly opRetainsService: OpRetainsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Créer une retenue' })
  @ApiBody({ type: CreateOpRetainDto })
  @ApiResponse({ status: HttpStatus.CREATED, schema: API_ENVELOPE_SCHEMA })
  async create(@Body() dto: CreateOpRetainDto) {
    const data = await this.opRetainsService.create(dto);
    return { success: true, message: 'Op retain created successfully', data };
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
    summary: 'Importer des retenues depuis Excel (.xlsx)',
    description: [
      '**Requête** : `multipart/form-data` avec le champ **`file`** (`.xlsx`, max 5 Mo). **Query obligatoire** : `clientId` — doit appartenir à la **société du JWT**.',
      '',
      '**Feuille** : 1ʳᵉ feuille. **Ligne 1** = en-têtes (ordre libre) :',
      '`RAISON SOCIALE DU FOURNISSEUR`, `ADRESSE`, `N°FACTURE`, `DATE`, `BASE`, `TAUX`, `MONTANT`.',
      '',
      '**Fournisseur** : recherche du tiers par **raison sociale** (nom, insensible à la casse/accents) ; **création auto** type **SUPPLIER** si absent (`ADRESSE` dans `tier.meta`).',
      '**DATE** → `date`, `month`, `year` ; **N°FACTURE** → `code` ; **BASE** / **TAUX** / **MONTANT** → montants.',
      '',
      'Modèle : `src/assets/xlsx/retains-import-template.xlsx`. Max **500** lignes utiles.',
    ].join('\n'),
  })
  @ApiQuery({
    name: 'clientId',
    required: true,
    description: 'UUID du client — fournisseurs rattachés à ce client.',
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
    schema: OP_RETAIN_IMPORT_RESPONSE_SCHEMA,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Fichier absent, client hors société JWT ou en-têtes Excel incomplets.',
  })
  async importFromExcel(
    @UploadedFile() file: RetainImportUploadedFile | undefined,
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
    const data = await this.opRetainsService.importFromExcelBuffer(
      file.buffer,
      companyId,
      clientId,
    );
    return {
      success: true,
      message: `Import retenues : ${data.createdCount} créé(s), ${data.failedCount} ligne(s) en erreur`,
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Lister les retenues' })
  @ApiQuery({ name: 'tierId', required: false, type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findAll(@Query('tierId') tierId?: string) {
    const data = await this.opRetainsService.findAll(tierId);
    return { success: true, message: 'Op retains retrieved successfully', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’une retenue' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findOne(@Param('id') id: string) {
    const data = await this.opRetainsService.findOne(id);
    return { success: true, message: 'Op retain retrieved successfully', data };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Mettre à jour une retenue' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateOpRetainDto })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async update(@Param('id') id: string, @Body() dto: UpdateOpRetainDto) {
    const data = await this.opRetainsService.update(id, dto);
    return { success: true, message: 'Op retain updated successfully', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une retenue (soft delete)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async remove(@Param('id') id: string) {
    const data = await this.opRetainsService.remove(id);
    return { success: true, message: 'Op retain deleted successfully', data };
  }
}
