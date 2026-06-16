import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { OpExemptionsService } from './op-exemptions.service';
import { CreateOpExemptionDto } from './dto/create-op-exemption.dto';
import { UpdateOpExemptionDto } from './dto/update-op-exemption.dto';
import { API_ENVELOPE_SCHEMA } from '../../common/swagger/api-envelope.schema';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

type ExemptionImportUploadedFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
};

@ApiTags('op-exemptions')
@ApiBearerAuth('JWT')
@Controller('op-exemptions')
export class OpExemptionsController {
  constructor(private readonly opExemptionsService: OpExemptionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Créer une exonération' })
  @ApiBody({ type: CreateOpExemptionDto })
  @ApiResponse({ status: HttpStatus.CREATED, schema: API_ENVELOPE_SCHEMA })
  async create(@Body() dto: CreateOpExemptionDto) {
    const data = await this.opExemptionsService.create(dto);
    return { success: true, message: 'Op exemption created successfully', data };
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
    summary: 'Importer des exonérations depuis Excel (.xlsx)',
    description: [
      '**Requête** : `multipart/form-data` avec le champ **`file`** (`.xlsx`, max 5 Mo). **Query obligatoires** : `clientId` (UUID du client), `year` (exercice, ex. `2025`).',
      '',
      '**Feuille** : 1ʳᵉ feuille. **Ligne 1** = en-têtes du modèle (ordre libre) :',
      '`MOIS DE LA DECLARATION`, `N° FACTURE`, `MONTANT HT`, `CLIENT`, `MOTIF`.',
      '',
      '**MOIS DE LA DECLARATION** : entier **1–12** (pas de date). **Année** : query `year`. **CLIENT** : nom du tiers — recherche **insensible à la casse** ; **création automatique** si absent.',
      '',
      'Modèle : `src/assets/xlsx/exemptions-import-template.xlsx`. Max **500** lignes utiles.',
    ].join('\n'),
  })
  @ApiQuery({
    name: 'clientId',
    required: true,
    description: 'UUID du client — tous les tiers résolus doivent lui appartenir.',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiQuery({
    name: 'year',
    required: true,
    description: 'Année de déclaration (exercice fiscal)',
    schema: { type: 'integer', example: 2025 },
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
    @UploadedFile() file: ExemptionImportUploadedFile | undefined,
    @Query('clientId') clientId: string,
    @Query('year') yearRaw: string,
    @CurrentUser() user: AuthUser,
  ) {
    if (!clientId?.trim()) {
      throw new BadRequestException('Query clientId is required');
    }
    const year = Number(yearRaw);
    if (!yearRaw?.trim() || !Number.isInteger(year)) {
      throw new BadRequestException('Query year is required (integer, e.g. 2025)');
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
    const data = await this.opExemptionsService.importFromExcelBuffer(
      file.buffer,
      companyId,
      clientId,
      year,
    );
    return {
      success: true,
      message: `Import exonérations : ${data.createdCount} créée(s), ${data.failedCount} ligne(s) en erreur`,
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Lister les exonérations' })
  @ApiQuery({ name: 'tierId', required: false, type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findAll(@Query('tierId') tierId?: string) {
    const data = await this.opExemptionsService.findAll(tierId);
    return { success: true, message: 'Op exemptions retrieved successfully', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’une exonération' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findOne(@Param('id') id: string) {
    const data = await this.opExemptionsService.findOne(id);
    return { success: true, message: 'Op exemption retrieved successfully', data };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Mettre à jour une exonération' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateOpExemptionDto })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async update(@Param('id') id: string, @Body() dto: UpdateOpExemptionDto) {
    const data = await this.opExemptionsService.update(id, dto);
    return { success: true, message: 'Op exemption updated successfully', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une exonération (soft delete)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async remove(@Param('id') id: string) {
    const data = await this.opExemptionsService.remove(id);
    return { success: true, message: 'Op exemption deleted successfully', data };
  }
}
