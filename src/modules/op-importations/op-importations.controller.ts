import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UploadedFile, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth, ApiQuery, ApiBody, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { OpImportationsService } from './op-importations.service';
import { CreateOpImportationDto } from './dto/create-op-importation.dto';
import { UpdateOpImportationDto } from './dto/update-op-importation.dto';
import { API_ENVELOPE_SCHEMA } from '../../common/swagger/api-envelope.schema';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

type ImportationImportUploadedFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
};

@ApiTags('op-importations')
@ApiBearerAuth('JWT')
@Controller('op-importations')
export class OpImportationsController {
  constructor(private readonly opImportationsService: OpImportationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Créer une importation' })
  @ApiBody({ type: CreateOpImportationDto })
  @ApiResponse({ status: HttpStatus.CREATED, schema: API_ENVELOPE_SCHEMA })
  async create(@Body() dto: CreateOpImportationDto) {
    const data = await this.opImportationsService.create(dto);
    return { success: true, message: 'Op importation created successfully', data };
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
    summary: 'Importer des importations depuis Excel (.xlsx)',
    description: [
      '**Requête** : `multipart/form-data` avec le champ **`file`** (`.xlsx`, max 5 Mo). **Query obligatoire** : `clientId`.',
      '',
      '**Feuille** : 1ʳᵉ feuille. **Ligne 1** = en-têtes :',
      '`ANNEE`, `MOIS`, `FOURNISSEUR`, `PAYS`, `ADRESSE`, `TYPE DEDUCTION`, `NATURE DU BIEN OU DU SERVICE`, `N°DECLARATION`, `DATE`, `MONTANT HT`, `TVA`, `TVA DETUCTIBLE`, `PRORATA`.',
      '',
      '**FOURNISSEUR** : tiers type **SUPPLIER** — création auto si absent. **TYPE DEDUCTION** / **NATURE** : création auto si absent (code abrégé / incrément). **PAYS** : match ou création.',
      '',
      'Modèle : `src/assets/xlsx/importations-import-template.xlsx`. Max **500** lignes utiles.',
    ].join('\n'),
  })
  @ApiQuery({
    name: 'clientId',
    required: true,
    description: 'UUID du client — fournisseurs rattachés à ce client.',
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
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Fichier manquant ou client hors société' })
  async importFromExcel(
    @UploadedFile() file: ImportationImportUploadedFile | undefined,
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
    const data = await this.opImportationsService.importFromExcelBuffer(
      file.buffer,
      companyId,
      clientId,
    );
    return {
      success: true,
      message: `Import importations : ${data.createdCount} créée(s), ${data.failedCount} ligne(s) en erreur`,
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Lister les importations' })
  @ApiQuery({ name: 'tierId', required: false, type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findAll(@Query('tierId') tierId?: string) {
    const data = await this.opImportationsService.findAll(tierId);
    return { success: true, message: 'Op importations retrieved successfully', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’une importation' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findOne(@Param('id') id: string) {
    const data = await this.opImportationsService.findOne(id);
    return { success: true, message: 'Op importation retrieved successfully', data };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Mettre à jour une importation' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateOpImportationDto })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async update(@Param('id') id: string, @Body() dto: UpdateOpImportationDto) {
    const data = await this.opImportationsService.update(id, dto);
    return { success: true, message: 'Op importation updated successfully', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une importation (soft delete)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async remove(@Param('id') id: string) {
    const data = await this.opImportationsService.remove(id);
    return { success: true, message: 'Op importation deleted successfully', data };
  }
}
