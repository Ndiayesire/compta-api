import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UploadedFile, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth, ApiQuery, ApiBody, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { OpImportationsService } from './op-importations.service';
import { CreateOpImportationDto } from './dto/create-op-importation.dto';
import { UpdateOpImportationDto } from './dto/update-op-importation.dto';
import { API_ENVELOPE_SCHEMA } from '../../common/swagger/api-envelope.schema';
import { OP_IMPORTATION_IMPORT_RESPONSE_SCHEMA } from './swagger/op-importation-import-response.schema';
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
  @ApiOperation({
    summary: 'Créer une importation',
    description:
      'Création JSON d’une ligne `op_importations`. Références obligatoires : `tierId` (fournisseur), `countryId`, `deductionTypeId`, `propertyNatureTypeId`. Montants (`net`, `tax`, `taxDeduction`, `total`, `prorata`) optionnels.',
  })
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
      '**Requête** : `multipart/form-data` avec le champ **`file`** (`.xlsx`, max 5 Mo). **Query obligatoire** : `clientId` (UUID du client) — doit appartenir à la **société du JWT**.',
      '',
      '**Feuille** : 1ʳᵉ feuille uniquement. **Ligne 1** = en-têtes (ordre libre, reconnaissance par libellé) :',
      '`ANNEE`, `MOIS`, `FOURNISSEUR`, `PAYS`, `ADRESSE`, `TYPE DEDUCTION`, `NATURE DU BIEN OU DU SERVICE`, `N°DECLARATION`, `DATE`, `MONTANT HT`, `TVA`, `TVA DETUCTIBLE` (typo acceptée), `PRORATA`.',
      '',
      '**Colonnes obligatoires** (ligne 1) : année, mois, fournisseur, pays, type déduction, nature, n° déclaration, date. **Optionnelles** : adresse, montants, prorata.',
      '',
      '**MOIS** : entier **1–12**. **DATE** : date Excel ou `JJ/MM/AAAA`.',
      '',
      '**Résolution métier** (scope `clientId`) :',
      '1. **FOURNISSEUR** — nom dans `tiers` (casse + accents) → sinon **création** avec type **SUPPLIER** (`tier_types.code = SUPPLIER`).',
      '2. **TYPE DEDUCTION** — nom dans `deduction_types` → sinon **création** (code = abréviation du libellé, ex. `DEDU-STAN`).',
      '3. **NATURE DU BIEN OU SERVICE** — nom dans `property_nature_types` → sinon **création** (code numérique incrémenté : `1`, `2`, `3`…).',
      '4. **PAYS** — nom ou code dans `settings_countries` (casse + accents) → sinon **création** (devise XOF par défaut).',
      '',
      '**Mapping API** : `ANNEE`/`MOIS` → `year`/`month` ; `N°DECLARATION` → `code` ; `MONTANT HT` → `net` ; `TVA` → `tax` ; `TVA DETUCTIBLE` → `taxDeduction` ; `PRORATA` → `prorata` ; `total` = `net` + `tax` − `taxDeduction` si les trois montants sont renseignés.',
      '',
      'Modèle : `src/assets/xlsx/importations-import-template.xlsx`. Max **500** lignes utiles (lignes vides ignorées).',
    ].join('\n'),
  })
  @ApiQuery({
    name: 'clientId',
    required: true,
    description:
      'UUID du client : fournisseurs résolus ou créés sont rattachés à ce client. Doit appartenir à la société du JWT.',
    schema: { type: 'string', format: 'uuid' },
    example: 'a0000021-0000-4000-8000-000000000001',
  })
  @ApiBody({
    description:
      'Corps **multipart** : une partie nommée **`file`** (fichier binaire `.xlsx`). Dans Swagger UI : « Try it out » puis sélectionner le fichier.',
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description:
            'Classeur Excel Open XML (.xlsx). MIME : application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (ou extension `.xlsx`).',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      'Import exécuté : compteurs (créations tiers, pays, types déduction/nature) et détail des lignes créées / erreurs.',
    schema: OP_IMPORTATION_IMPORT_RESPONSE_SCHEMA,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Fichier absent ou non `.xlsx`, `clientId` manquant, client hors société JWT, utilisateur sans `companyId`, en-têtes Excel incomplets ou classeur illisible.',
  })
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
  @ApiOperation({
    summary: 'Lister les importations',
    description:
      'Liste les `op_importations` non supprimées. Filtre optionnel `tierId` (fournisseur). Inclut `tier`, `country`, `deductionType`, `propertyNatureType`.',
  })
  @ApiQuery({
    name: 'tierId',
    required: false,
    type: String,
    description: 'UUID du fournisseur (tiers) — filtre optionnel',
  })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findAll(@Query('tierId') tierId?: string) {
    const data = await this.opImportationsService.findAll(tierId);
    return { success: true, message: 'Op importations retrieved successfully', data };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Détail d’une importation',
    description: 'Retourne une importation par UUID avec relations tier, pays, type déduction et nature de bien.',
  })
  @ApiParam({ name: 'id', type: String, description: 'UUID op_importation' })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Importation introuvable' })
  async findOne(@Param('id') id: string) {
    const data = await this.opImportationsService.findOne(id);
    return { success: true, message: 'Op importation retrieved successfully', data };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Mettre à jour une importation',
    description: 'Mise à jour partielle (`code`, montants, `prorata`, références FK, etc.).',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateOpImportationDto })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async update(@Param('id') id: string, @Body() dto: UpdateOpImportationDto) {
    const data = await this.opImportationsService.update(id, dto);
    return { success: true, message: 'Op importation updated successfully', data };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer une importation (soft delete)',
    description: 'Positionne `deletedAt` — la ligne n’apparaît plus dans les listes.',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async remove(@Param('id') id: string) {
    const data = await this.opImportationsService.remove(id);
    return { success: true, message: 'Op importation deleted successfully', data };
  }
}
