import { BadRequestException, Body, Controller, Delete, Get, HttpStatus, Param, Patch, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BalancesService } from './balances.service';
import { UpdateBalanceLineDto } from './dto/update-balance-line.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { API_ENVELOPE_SCHEMA } from '../../common/swagger/api-envelope.schema';

@ApiTags('balance-lines')
@ApiBearerAuth('JWT')
@Controller('balance-lines')
export class BalanceLinesController {
  constructor(private readonly balancesService: BalancesService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les lignes d’une balance',
    description:
      '**Obligatoire** : query `balanceId` (UUID). Import : `POST /balances/{balanceId}/balance-lines/import` avec `.xlsx` (**8 colonnes** ; détail sous **balances** → import Excel). Le modèle d’exemple inclut des **infobulles** sur les en-têtes.',
  })
  @ApiQuery({
    name: 'balanceId',
    required: true,
    description: 'UUID de la balance',
    example: 'b0000001-0000-4000-8000-000000000001',
  })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '`balanceId` manquant ou balance hors société',
  })
  async findAll(
    @Query('balanceId') balanceId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    if (!balanceId) {
      throw new BadRequestException('balanceId query parameter is required');
    }
    const data = await this.balancesService.findAllBalanceLines(
      balanceId,
      companyId,
    );
    return {
      success: true,
      message: 'Balance lines retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’une ligne de balance' })
  @ApiParam({ name: 'id', description: 'UUID `balance_line_id`', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Inconnue' })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const data = await this.balancesService.findOneBalanceLine(id, companyId);
    return {
      success: true,
      message: 'Balance line retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Mettre à jour une ligne',
    description: 'Le rattachement à une balance ne change pas via ce DTO.',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateBalanceLineDto })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Inconnue' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBalanceLineDto,
    @CurrentUser() user: AuthUser,
  ) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const data = await this.balancesService.updateBalanceLine(
      id,
      dto,
      companyId,
    );
    return {
      success: true,
      message: 'Balance line updated successfully',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer une ligne (soft delete)',
    description: 'Renseigne `balance_line_deleted_at`.',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Inconnue' })
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const data = await this.balancesService.removeBalanceLine(id, companyId);
    return {
      success: true,
      message: 'Balance line deleted successfully',
      data,
    };
  }
}
