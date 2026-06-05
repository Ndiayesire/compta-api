import { Controller, Get, Post, Body, Param, ParseUUIDPipe, Patch, Delete, Query, UseInterceptors, UploadedFile, BadRequestException, HttpCode, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiBody, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';

type EmployeeImportUploadedFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
};

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

@ApiTags('employees')
@ApiBearerAuth('JWT')
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create employee',
    description:
      "CrÃ©e l'employÃ© puis son contrat courant dans `employee_contract_types` (contractTypeId, dates, poste, salaire, manager).",
  })
  @ApiResponse({
    status: 201,
    description: 'Employee created successfully',
  })
  async create(@Body() dto: CreateEmployeeDto) {
    const data = await this.employeesService.create(dto);

    return {
      success: true,
      message: 'Employee created successfully',
      data,
    };
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
    summary: 'Importer des employÃ©s depuis un Excel (.xlsx)',
    description: [
      '**RequÃªte** : `multipart/form-data` avec le champ **`file`** (classeur `.xlsx`, max 5 Mo). **Query obligatoire** : `clientId` (UUID du client entreprise) â€” doit exister et appartenir Ã  la **sociÃ©tÃ© du JWT**.',
      '',
      '**Feuille** : uniquement la **1Ê³áµ‰ feuille**. **Ligne 1** = libellÃ©s de colonnes. Les colonnes sont reconnues par **texte dâ€™en-tÃªte** (normalisation : accents / casse / espaces) â€” **lâ€™ordre des colonnes est libre**.',
      '',
      '**En-tÃªtes obligatoires** (au moins une variante reconnue) : `Type de contrat`, `Prenom` ou `PrÃ©nom`, `Nom`, `Poste`, `Email`, `Telephone` ou `TÃ©lÃ©phone`, `Adresse`, `Date de dÃ©but`, `Date de fin`.',
      '',
      '**En-tÃªtes optionnels** : `Type d\'identification`, `Numero d\'identification` / `NumÃ©ro d\'identification` (nÂ° de piÃ¨ce), `Numero d\'identification social` / `NumÃ©ro d\'identification social` (NASS), `Salaire`, `Cadre` (oui/non, 1/0, true/falseâ€¦ pour statut manager).',
      '',
      '**RÃ©solution par nom** (pas dâ€™UUID dans le fichier) : type de contrat et type dâ€™identification sont cherchÃ©s parmi les rÃ©glages actifs. **`clientId`** nâ€™est pas une colonne Excel.',
      '',
      '**Lignes** : donnÃ©es Ã  partir de la ligne 2 ; lignes vides ignorÃ©es ; traitement plafonnÃ© Ã  **500** lignes utiles. `isActive` sur les employÃ©s crÃ©Ã©s : valeurs par dÃ©faut cÃ´tÃ© API.',
    ].join('\n'),
  })
  @ApiQuery({
    name: 'clientId',
    required: true,
    description:
      'UUID du client (entreprise cliente) : toutes les lignes importÃ©es y sont rattachÃ©es. Doit appartenir Ã  la sociÃ©tÃ© du JWT.',
    schema: { type: 'string', format: 'uuid' },
    example: '00000000-0000-4000-8000-000000000001',
  })
  @ApiBody({
    description:
      'Corps **multipart** : une partie nommÃ©e **`file`** (fichier binaire `.xlsx`). Dans Swagger UI, utiliser Â« Try it out Â» puis le contrÃ´le fichier pour `file`.',
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description:
            'Classeur Excel Open XML (.xlsx). MIME attendu : application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (ou nom de fichier se terminant par .xlsx).',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description:
      'Import exÃ©cutÃ© : compteurs et dÃ©tail des crÃ©ations / erreurs par numÃ©ro de ligne Excel.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Import employÃ©s : 2 crÃ©Ã©(s), 0 ligne(s) en erreur',
        },
        data: {
          type: 'object',
          properties: {
            createdCount: { type: 'integer', example: 2 },
            failedCount: { type: 'integer', example: 0 },
            created: {
              type: 'array',
              description: 'EmployÃ©s crÃ©Ã©s (mÃªme forme que GET employÃ©)',
              items: { type: 'object' },
            },
            errors: {
              type: 'array',
              description: 'Erreurs par ligne (numÃ©ro de ligne = feuille Excel)',
              items: {
                type: 'object',
                properties: {
                  row: { type: 'integer', example: 5 },
                  message: { type: 'string', example: 'Type de contrat inconnu : Â« XYZ Â»' },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Fichier absent ou invalide, `clientId` invalide, client hors sociÃ©tÃ© JWT, utilisateur sans `companyId`, ou en-tÃªtes Excel incomplets / classeur illisible.',
  })
  @ApiResponse({ status: 401, description: 'JWT manquant ou invalide' })
  async importExcel(
    @Query('clientId', ParseUUIDPipe) clientId: string,
    @UploadedFile() file: EmployeeImportUploadedFile | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    if (!file?.buffer?.length) {
      throw new BadRequestException('Fichier Excel requis (multipart, champ `file`)');
    }
    const nameOk = /\.xlsx$/i.test(file.originalname ?? '');
    const mimeOk =
      file.mimetype === XLSX_MIME ||
      file.mimetype === 'application/octet-stream' ||
      nameOk;
    if (!mimeOk) {
      throw new BadRequestException(
        `Fichier .xlsx attendu (MIME ${XLSX_MIME} ou nom se terminant par .xlsx)`,
      );
    }
    const data = await this.employeesService.importFromExcelBuffer(
      file.buffer,
      companyId,
      clientId,
    );
    return {
      success: true,
      message: `Import employÃ©s : ${data.createdCount} crÃ©Ã©(s), ${data.failedCount} ligne(s) en erreur`,
      data,
    };
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'Get employees by client' })
  @ApiParam({ name: 'clientId', type: String })
  @ApiResponse({
    status: 200,
    description: 'Client employees retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Client employees retrieved successfully',
        },
        data: {
          type: 'array',
          items: { type: 'object' },
        },
      },
    },
  })
  async findByClient(@Param('clientId') clientId: string) {
    const data = await this.employeesService.findByClient(clientId);

    return {
      success: true,
      message: 'Client employees retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Employee retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Employee retrieved successfully',
        },
        data: { type: 'object' },
      },
    },
  })
  async findOne(@Param('id') id: string) {
    const data = await this.employeesService.findOne(id);

    return {
      success: true,
      message: 'Employee retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update employee',
    description:
      "Met Ã  jour uniquement les champs de l'employÃ© (`employees`). Les donnÃ©es contractuelles sont gÃ©rÃ©es via `/employee-contracts`.",
  })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({
    description: "Champs modifiables cÃ´tÃ© employÃ© uniquement (pas de contrat).",
    schema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', format: 'uuid' },
        identificationTypeId: { type: 'string', format: 'uuid', nullable: true },
        firstName: { type: 'string', example: 'Mamadou' },
        lastName: { type: 'string', example: 'Ndiaye' },
        email: { type: 'string', format: 'email', example: 'mamadou.ndiaye@entreprise.sn' },
        phone: { type: 'string', example: '+221771234567' },
        address: { type: 'string', example: 'Dakar, Plateau' },
        socialInsuranceNumber: { type: 'string', example: '1 85 08 75 123 456 78' },
        identityNumber: { type: 'string', example: 'AB1234567' },
        isActive: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Employee updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Employee updated successfully',
        },
        data: { type: 'object' },
      },
    },
  })
  async update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    const data = await this.employeesService.update(id, dto);

    return {
      success: true,
      message: 'Employee updated successfully',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete employee' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Employee deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Employee deleted successfully',
        },
        data: { type: 'object' },
      },
    },
  })
  async remove(@Param('id') id: string) {
    const data = await this.employeesService.remove(id);

    return {
      success: true,
      message: 'Employee deleted successfully',
      data,
    };
  }
}
