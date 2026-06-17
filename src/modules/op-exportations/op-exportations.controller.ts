import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UploadedFile, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth, ApiQuery, ApiBody, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { OpExportationsService } from './op-exportations.service';
import { CreateOpExportationDto } from './dto/create-op-exportation.dto';
import { UpdateOpExportationDto } from './dto/update-op-exportation.dto';
import { API_ENVELOPE_SCHEMA } from '../../common/swagger/api-envelope.schema';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

type ExportationImportUploadedFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
};

@ApiTags('op-exportations')
@ApiBearerAuth('JWT')
@Controller('op-exportations')
export class OpExportationsController {
  constructor(private readonly opExportationsService: OpExportationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Créer une exportation' })
  @ApiBody({ type: CreateOpExportationDto })
  @ApiResponse({ status: HttpStatus.CREATED, schema: API_ENVELOPE_SCHEMA })
  async create(@Body() dto: CreateOpExportationDto) {
    const data = await this.opExportationsService.create(dto);
    return { success: true, message: 'Op exportation created successfully', data };
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
    summary: 'Importer des exportations depuis Excel (.xlsx)',
    description: [
      '**Requête** : `multipart/form-data` avec le champ **`file`** (`.xlsx`, max 5 Mo). **Query obligatoire** : `clientId` (UUID du client).',
      '',
      '**Feuille** : 1ʳᵉ feuille. **Ligne 1** = en-têtes du modèle (ordre libre) :',
      '`ANNEE`, `MOIS`, `NINEA`, `CLIENT`, `ADRESSE`, `PAYS`, `N°FACTURE`, `MONTANT`.',
      '',
      '**MOIS** : entier **1–12**. **ANNEE** : entier (ex. `2025`) en colonne. **PAYS** : nom ou code pays (casse + accents ignorés). **NINEA** puis **CLIENT** : résolution tiers — **mise à jour** si correspondance, **création** sinon.',
      '',
      'Modèle : `src/assets/xlsx/exportations-import-template.xlsx`. Max **500** lignes utiles.',
    ].join('\n'),
  })
  @ApiQuery({
    name: 'clientId',
    required: true,
    description: 'UUID du client — tous les tiers résolus doivent lui appartenir.',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'Classeur .xlsx' },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.CREATED, schema: API_ENVELOPE_SCHEMA })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Fichier manquant, en-têtes invalides ou client hors société' })
  async importFromExcel(
    @UploadedFile() file: ExportationImportUploadedFile | undefined,
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
    const data = await this.opExportationsService.importFromExcelBuffer(
      file.buffer,
      companyId,
      clientId,
    );
    return {
      success: true,
      message: `Import exportations : ${data.createdCount} créée(s), ${data.failedCount} ligne(s) en erreur`,
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Lister les exportations' })
  @ApiQuery({ name: 'tierId', required: false, type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findAll(@Query('tierId') tierId?: string) {
    const data = await this.opExportationsService.findAll(tierId);
    return { success: true, message: 'Op exportations retrieved successfully', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’une exportation' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findOne(@Param('id') id: string) {
    const data = await this.opExportationsService.findOne(id);
    return { success: true, message: 'Op exportation retrieved successfully', data };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Mettre à jour une exportation' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateOpExportationDto })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async update(@Param('id') id: string, @Body() dto: UpdateOpExportationDto) {
    const data = await this.opExportationsService.update(id, dto);
    return { success: true, message: 'Op exportation updated successfully', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une exportation (soft delete)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async remove(@Param('id') id: string) {
    const data = await this.opExportationsService.remove(id);
    return { success: true, message: 'Op exportation deleted successfully', data };
  }
}
