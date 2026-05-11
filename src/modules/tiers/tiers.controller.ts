import {
  BadRequestException,
  ConflictException,
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Res,
  Query,
} from '@nestjs/common';
import type { Response } from 'express';
import { TiersService } from './tiers.service';
import { CreateTierDto } from './dto/create-tier.dto';
import { UpdateTierDto } from './dto/update-tier.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiProduces,
  ApiQuery,
  ApiOkResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { TiersExportJobsService } from './tiers-export-jobs.service';

@ApiTags('tiers')
@ApiBearerAuth('JWT')
@Controller('tiers')
export class TiersController {
  constructor(
    private readonly tiersService: TiersService,
    private readonly tiersExportJobsService: TiersExportJobsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Create a tier for a client of your company',
    description:
      'Links a `tiers` row to `client_id` and `tier_type_id`.',
  })
  @ApiResponse({ status: 201, description: 'Tier created' })
  @ApiResponse({ status: 400, description: 'Invalid client or tier type' })
  async create(@Body() dto: CreateTierDto, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const data = await this.tiersService.create(dto, companyId);
    return {
      success: true,
      message: 'Tier created successfully',
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all tiers for your company' })
  async findAll(@CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const data = await this.tiersService.findAll(companyId);
    return {
      success: true,
      message: 'Tiers retrieved successfully',
      data,
    };
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'List tiers for a client' })
  @ApiParam({ name: 'clientId', type: String })
  async findByClient(
    @Param('clientId') clientId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const data = await this.tiersService.findByClient(clientId, companyId);
    return {
      success: true,
      message: 'Tiers retrieved successfully',
      data,
    };
  }

  @Get(':clientId/xlsx/annual')
  @ApiTags('Etats', 'tiers')
  @ApiOperation({
    summary: 'État annuel des sommes versées (Excel DGID)',
    description:
      'Télécharge un classeur **.xlsx** (corps binaire). Agrège les sommes sur **tout l’exercice**. '
  })
  @ApiParam({
    name: 'clientId',
    type: String,
    description: 'UUID du client (appartenant à votre société)',
    example: 'a0000021-0000-4000-8000-000000000001',
  })
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @ApiQuery({
    name: 'accountingYearId',
    required: true,
    description:
      "Identifiant de l'exercice comptable (agrégation sur toute la période)",
    type: String,
    example: 'a000002b-0000-4000-8000-000000000001',
  })
  @ApiOkResponse({
    description: 'Fichier Excel (.xlsx)',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      '`accountingYearId` manquant, utilisateur sans société, ou client / exercice invalide',
  })
  async exportAnnualExcel(
    @Param('clientId') clientId: string,
    @CurrentUser() user: AuthUser,
    @Query('accountingYearId') accountingYearId: string,
    @Res({ passthrough: false }) res: Response,
  ) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    if (!accountingYearId) {
      throw new BadRequestException('accountingYearId is required');
    }
    const result = await this.tiersService.renderTierAnnualExcel(
      clientId,
      companyId,
      accountingYearId,
    );
    const filename = `${result.filenameBase}.xlsx`;
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(result.buffer);
  }

  @Post(':clientId/xlsx/annual/jobs')
  @ApiTags('Etats', 'tiers')
  @ApiOperation({
    summary: 'Créer un job asynchrone pour export annuel Excel',
  })
  @ApiQuery({
    name: 'accountingYearId',
    required: true,
    type: String,
  })
  @ApiResponse({
    status: 201,
    description: 'Job annuel créé',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Annual export job created' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '2a0d2ce6-3fea-4e42-8df2-fc0a7cb260d9' },
            type: { type: 'string', example: 'annual' },
            status: { type: 'string', example: 'pending' },
          },
        },
      },
    },
  })
  async createAnnualExportJob(
    @Param('clientId') clientId: string,
    @CurrentUser() user: AuthUser,
    @Query('accountingYearId') accountingYearId: string,
  ) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    if (!accountingYearId) {
      throw new BadRequestException('accountingYearId is required');
    }
    const job = this.tiersExportJobsService.enqueueAnnual({
      clientId,
      companyId,
      accountingYearId,
    });
    return {
      success: true,
      message: 'Annual export job created',
      data: job,
    };
  }

  @Get(':clientId/xlsx')
  @ApiTags('Etats', 'tiers')
  @ApiOperation({
    summary: 'État trimestriel des sommes versées (Excel DGID)',
    description:
      'Télécharge un classeur **.xlsx** (corps binaire). Filtre sur **exercice + trimestre**. '
  })
  @ApiParam({
    name: 'clientId',
    type: String,
    description: 'UUID du client (appartenant à votre société)',
    example: 'a0000021-0000-4000-8000-000000000001',
  })
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @ApiQuery({
    name: 'accountingYearId',
    required: true,
    description: "Identifiant de l'exercice comptable",
    type: String,
    example: 'a000002b-0000-4000-8000-000000000001',
  })
  @ApiQuery({
    name: 'accountingQuarterId',
    required: true,
    description: 'Identifiant du trimestre comptable',
    type: String,
    example: 'a000002c-0000-4000-8000-000000000001',
  })
  @ApiOkResponse({
    description: 'Fichier Excel (.xlsx)',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      '`accountingYearId` / `accountingQuarterId` manquants, utilisateur sans société, ou données invalides',
  })
  async exportExcel(
    @Param('clientId') clientId: string,
    @CurrentUser() user: AuthUser,
    @Query('accountingYearId') accountingYearId: string,
    @Query('accountingQuarterId') accountingQuarterId: string,
    @Res({ passthrough: false }) res: Response,
  ) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    if (!accountingYearId || !accountingQuarterId) {
      throw new BadRequestException(
        'accountingYearId and accountingQuarterId are required',
      );
    }
    const result = await this.tiersService.renderTierExcel(
      clientId,
      companyId,
      accountingYearId,
      accountingQuarterId,
    );
    const filename = `${result.filenameBase}.xlsx`;
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(result.buffer);
  }

  @Post(':clientId/xlsx/jobs')
  @ApiTags('Etats', 'tiers')
  @ApiOperation({
    summary: 'Créer un job asynchrone pour export trimestriel Excel',
  })
  @ApiQuery({
    name: 'accountingYearId',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'accountingQuarterId',
    required: true,
    type: String,
  })
  @ApiResponse({
    status: 201,
    description: 'Job trimestriel créé',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Quarterly export job created' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '2a0d2ce6-3fea-4e42-8df2-fc0a7cb260d9' },
            type: { type: 'string', example: 'quarterly' },
            status: { type: 'string', example: 'pending' },
          },
        },
      },
    },
  })
  async createQuarterlyExportJob(
    @Param('clientId') clientId: string,
    @CurrentUser() user: AuthUser,
    @Query('accountingYearId') accountingYearId: string,
    @Query('accountingQuarterId') accountingQuarterId: string,
  ) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    if (!accountingYearId || !accountingQuarterId) {
      throw new BadRequestException(
        'accountingYearId and accountingQuarterId are required',
      );
    }
    const job = this.tiersExportJobsService.enqueueQuarterly({
      clientId,
      companyId,
      accountingYearId,
      accountingQuarterId,
    });
    return {
      success: true,
      message: 'Quarterly export job created',
      data: job,
    };
  }

  @Get('jobs/:jobId')
  @ApiOperation({ summary: "Consulter l'etat d'un job d'export" })
  @ApiResponse({
    status: 200,
    description: "État courant d'un job d'export",
  })
  async getExportJob(@Param('jobId') jobId: string) {
    const data = this.tiersExportJobsService.getJob(jobId);
    return {
      success: true,
      message: 'Export job fetched successfully',
      data,
    };
  }

  @Get('jobs/:jobId/download')
  @ApiOperation({ summary: "Télécharger le fichier d'un job terminé" })
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @ApiOkResponse({
    description: "Fichier Excel du job (.xlsx)",
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Job en cours ou en échec',
  })
  async downloadExportJob(
    @Param('jobId') jobId: string,
    @Res({ passthrough: false }) res: Response,
  ) {
    const job = this.tiersExportJobsService.getJob(jobId);
    if (job.status === 'pending' || job.status === 'running') {
      throw new ConflictException('Export job is still running');
    }
    if (job.status === 'failed') {
      throw new ConflictException(
        `Export job failed: ${job.error ?? 'unknown error'}`,
      );
    }
    const file = this.tiersExportJobsService.getCompletedFile(jobId);
    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename="${file.filename}"`,
    });
    res.send(file.buffer);
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get tier by ID' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const data = await this.tiersService.findOne(id, companyId);
    return {
      success: true,
      message: 'Tier retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Update tier' })
  @ApiParam({ name: 'id', type: String })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTierDto,
    @CurrentUser() user: AuthUser,
  ) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const data = await this.tiersService.update(id, dto, companyId);
    return {
      success: true,
      message: 'Tier updated successfully',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete tier' })
  @ApiParam({ name: 'id', type: String })
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const data = await this.tiersService.remove(id, companyId);
    return {
      success: true,
      message: 'Tier deleted successfully',
      data,
    };
  }
}
