import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UploadedFile, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth, ApiQuery, ApiBody, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { OpLocalPurchasesService } from './op-local-purchases.service';
import { CreateOpLocalPurchaseDto } from './dto/create-op-local-purchase.dto';
import { UpdateOpLocalPurchaseDto } from './dto/update-op-local-purchase.dto';
import { API_ENVELOPE_SCHEMA } from '../../common/swagger/api-envelope.schema';
import { OP_LOCAL_PURCHASE_IMPORT_RESPONSE_SCHEMA } from './swagger/op-local-purchase-import-response.schema';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

type LocalPurchaseImportUploadedFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
};

@ApiTags('op-local-purchases')
@ApiBearerAuth('JWT')
@Controller('op-local-purchases')
export class OpLocalPurchasesController {
  constructor(private readonly opLocalPurchasesService: OpLocalPurchasesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Créer un achat local' })
  @ApiBody({ type: CreateOpLocalPurchaseDto })
  @ApiResponse({ status: HttpStatus.CREATED, schema: API_ENVELOPE_SCHEMA })
  async create(@Body() dto: CreateOpLocalPurchaseDto) {
    const data = await this.opLocalPurchasesService.create(dto);
    return { success: true, message: 'Op local purchase created successfully', data };
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
    summary: 'Importer des achats locaux depuis Excel (.xlsx)',
    description: [
      '**Requête** : `multipart/form-data` avec le champ **`file`** (`.xlsx`, max 5 Mo). **Query obligatoire** : `clientId` (UUID du client) — doit appartenir à la **société du JWT**.',
      '',
      '**Feuille** : 1ʳᵉ feuille. **Ligne 1** = en-têtes (ordre libre) :',
      '`ANNEE`, `MOIS`, `NINEA`, `COFI`, `FOURNISSEUR`, `ADRESSE`, `TYPE DEDUCTION`, `NATURE DU BIEN OU SERVICE`, `MONTANT HT`, `TVA`, `TVA DEDUITE`, `TTC`, `TX PRORATA`.',
      '',
      '**Résolution fournisseur** (scope `clientId`) : NINEA → nom **FOURNISSEUR** → mise à jour ou **création** type **SUPPLIER** ; **COFI** stocké dans `tier.meta.cofi`.',
      '**TYPE DEDUCTION** / **NATURE** : création auto si absent (code abrégé / incrément).',
      '',
      'Modèle : `src/assets/xlsx/purchases-import-template.xlsx`. Max **500** lignes utiles.',
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
        file: {
          type: 'string',
          format: 'binary',
          description: 'Classeur Excel Open XML (.xlsx)',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Import exécuté : compteurs et détail des créations / erreurs.',
    schema: OP_LOCAL_PURCHASE_IMPORT_RESPONSE_SCHEMA,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Fichier absent, client hors société JWT ou en-têtes Excel incomplets.',
  })
  async importFromExcel(
    @UploadedFile() file: LocalPurchaseImportUploadedFile | undefined,
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
    const data = await this.opLocalPurchasesService.importFromExcelBuffer(
      file.buffer,
      companyId,
      clientId,
    );
    return {
      success: true,
      message: `Import achats locaux : ${data.createdCount} créé(s), ${data.failedCount} ligne(s) en erreur`,
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Lister les achats locaux' })
  @ApiQuery({ name: 'tierId', required: false, type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findAll(@Query('tierId') tierId?: string) {
    const data = await this.opLocalPurchasesService.findAll(tierId);
    return { success: true, message: 'Op local purchases retrieved successfully', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’un achat local' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findOne(@Param('id') id: string) {
    const data = await this.opLocalPurchasesService.findOne(id);
    return { success: true, message: 'Op local purchase retrieved successfully', data };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Mettre à jour un achat local' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateOpLocalPurchaseDto })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async update(@Param('id') id: string, @Body() dto: UpdateOpLocalPurchaseDto) {
    const data = await this.opLocalPurchasesService.update(id, dto);
    return { success: true, message: 'Op local purchase updated successfully', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un achat local (soft delete)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async remove(@Param('id') id: string) {
    const data = await this.opLocalPurchasesService.remove(id);
    return { success: true, message: 'Op local purchase deleted successfully', data };
  }
}
