import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UploadedFile, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth, ApiQuery, ApiBody, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { OpSuspensionsService } from './op-suspensions.service';
import { CreateOpSuspensionDto } from './dto/create-op-suspension.dto';
import { UpdateOpSuspensionDto } from './dto/update-op-suspension.dto';
import { API_ENVELOPE_SCHEMA } from '../../common/swagger/api-envelope.schema';
import { OP_SUSPENSION_IMPORT_RESPONSE_SCHEMA } from './swagger/op-suspension-import-response.schema';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

type SuspensionImportUploadedFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
};

@ApiTags('op-suspensions')
@ApiBearerAuth('JWT')
@Controller('op-suspensions')
export class OpSuspensionsController {
  constructor(private readonly opSuspensionsService: OpSuspensionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Créer une suspension' })
  @ApiBody({ type: CreateOpSuspensionDto })
  @ApiResponse({ status: HttpStatus.CREATED, schema: API_ENVELOPE_SCHEMA })
  async create(@Body() dto: CreateOpSuspensionDto) {
    const data = await this.opSuspensionsService.create(dto);
    return { success: true, message: 'Op suspension created successfully', data };
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
    summary: 'Importer des suspensions depuis Excel (.xlsx)',
    description: [
      '**Requête** : `multipart/form-data` avec le champ **`file`** (`.xlsx`, max 5 Mo). **Query obligatoire** : `clientId` — doit appartenir à la **société du JWT**.',
      '',
      '**Feuille** : 1ʳᵉ feuille. **Ligne 1** = en-têtes (ordre libre) :',
      '`ANNEE`, `MOIS`, `NINEA`, `DENOMINATION DU CLIENT`, `ADRESSE`, `N°FACTURE`, `MONTANT`, `TVA`, `N°VISA`, `DATE VISA`.',
      '',
      '**Tiers** : 1) recherche par **NINEA** ; 2) sinon par **DENOMINATION DU CLIENT** (nom) ; 3) **création auto** si absent (`ADRESSE` dans `tier.meta`).',
      '**MONTANT** → `net` ; **TVA** → `tax` ; `total` = `net` + `tax` ; **DATE VISA** / **N°VISA** → visa.',
      '',
      'Modèle : `src/assets/xlsx/suspensions-import-template.xlsx`. Max **500** lignes utiles.',
    ].join('\n'),
  })
  @ApiQuery({
    name: 'clientId',
    required: true,
    description: 'UUID du client — tiers rattachés à ce client.',
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
    schema: OP_SUSPENSION_IMPORT_RESPONSE_SCHEMA,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Fichier absent, client hors société JWT ou en-têtes Excel incomplets.',
  })
  async importFromExcel(
    @UploadedFile() file: SuspensionImportUploadedFile | undefined,
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
    const data = await this.opSuspensionsService.importFromExcelBuffer(
      file.buffer,
      companyId,
      clientId,
    );
    return {
      success: true,
      message: `Import suspensions : ${data.createdCount} créé(s), ${data.failedCount} ligne(s) en erreur`,
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Lister les suspensions' })
  @ApiQuery({ name: 'tierId', required: false, type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findAll(@Query('tierId') tierId?: string) {
    const data = await this.opSuspensionsService.findAll(tierId);
    return { success: true, message: 'Op suspensions retrieved successfully', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’une suspension' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findOne(@Param('id') id: string) {
    const data = await this.opSuspensionsService.findOne(id);
    return { success: true, message: 'Op suspension retrieved successfully', data };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Mettre à jour une suspension' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateOpSuspensionDto })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async update(@Param('id') id: string, @Body() dto: UpdateOpSuspensionDto) {
    const data = await this.opSuspensionsService.update(id, dto);
    return { success: true, message: 'Op suspension updated successfully', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une suspension (soft delete)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async remove(@Param('id') id: string) {
    const data = await this.opSuspensionsService.remove(id);
    return { success: true, message: 'Op suspension deleted successfully', data };
  }
}
