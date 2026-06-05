import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth, ApiQuery, ApiBody, ApiResponse } from '@nestjs/swagger';
import { OpTurnoversService } from './op-turnovers.service';
import { CreateOpTurnoverDto } from './dto/create-op-turnover.dto';
import { UpdateOpTurnoverDto } from './dto/update-op-turnover.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { API_ENVELOPE_SCHEMA } from '../../common/swagger/api-envelope.schema';

@ApiTags('op-turnovers')
@ApiBearerAuth('JWT')
@Controller('op-turnovers')
export class OpTurnoversController {
  constructor(private readonly opTurnoversService: OpTurnoversService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'CrÃ©er un chiffre dâ€™affaires (op_turnover)' })
  @ApiBody({ type: CreateOpTurnoverDto })
  @ApiResponse({ status: HttpStatus.CREATED, schema: API_ENVELOPE_SCHEMA })
  async create(@Body() dto: CreateOpTurnoverDto, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    const data = await this.opTurnoversService.create(dto, companyId);
    return { success: true, message: 'Op turnover created successfully', data };
  }

  @Get()
  @ApiOperation({ summary: 'Lister les chiffres dâ€™affaires de la sociÃ©tÃ©' })
  @ApiQuery({ name: 'clientId', required: false, type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findAll(@CurrentUser() user: AuthUser, @Query('clientId') clientId?: string) {
    const companyId = user.companyId;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    const data = await this.opTurnoversService.findAll(companyId, clientId);
    return { success: true, message: 'Op turnovers retrieved successfully', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'DÃ©tail dâ€™un chiffre dâ€™affaires' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    const data = await this.opTurnoversService.findOne(id, companyId);
    return { success: true, message: 'Op turnover retrieved successfully', data };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Mettre Ã  jour un chiffre dâ€™affaires' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateOpTurnoverDto })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async update(@Param('id') id: string, @Body() dto: UpdateOpTurnoverDto, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    const data = await this.opTurnoversService.update(id, dto, companyId);
    return { success: true, message: 'Op turnover updated successfully', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un chiffre dâ€™affaires (soft delete)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    const data = await this.opTurnoversService.remove(id, companyId);
    return { success: true, message: 'Op turnover deleted successfully', data };
  }
}
