import {
  BadRequestException,
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

@ApiTags('tiers')
@ApiBearerAuth('JWT')
@Controller('tiers')
export class TiersController {
  constructor(private readonly tiersService: TiersService) {}

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
      'Télécharge un classeur **.xlsx** (corps binaire). Agrège les sommes sur **tout l’exercice**. ' +
      'Exemples seed (`prisma/seed.cjs`) : `clientId` = `a0000021-0000-4000-8000-000000000001`, ' +
      '`accountingYearId` = `a000002b-0000-4000-8000-000000000001`.',
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

  @Get(':clientId/xlsx')
  @ApiTags('Etats', 'tiers')
  @ApiOperation({
    summary: 'État trimestriel des sommes versées (Excel DGID)',
    description:
      'Télécharge un classeur **.xlsx** (corps binaire). Filtre sur **exercice + trimestre**. ' +
      'Exemples seed (`prisma/seed.cjs`) : `clientId` = `a0000021-…`, `accountingYearId` = `a000002b-…`, ' +
      '`accountingQuarterId` = `a000002c-…` (Premier trimestre 2025).',
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

  // PDF endpoint temporarily disabled (kept for later).
  // @Get(':id/pdf')
  // @ApiOperation({
  //   summary:
  //     'Télécharger le PDF « État trimestriel » (positionnement basé sur le classeur Excel)',
  // })
  // @ApiParam({ name: 'id', type: String })
  // @ApiProduces('application/pdf')
  // async exportPdf(
  //   @Param('id') id: string,
  //   @CurrentUser() user: AuthUser,
  //   @Res({ passthrough: false }) res: Response,
  // ) {
  //   const companyId = user.companyId;
  //   if (!companyId) {
  //     throw new BadRequestException('User must belong to a company');
  //   }
  //   const buffer = await this.tiersService.renderTierPdf(id, companyId);
  //   const filename = `tier-${id}.pdf`;
  //   res.set({
  //     'Content-Type': 'application/pdf',
  //     'Content-Disposition': `attachment; filename="${filename}"`,
  //   });
  //   res.send(buffer);
  // }

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
