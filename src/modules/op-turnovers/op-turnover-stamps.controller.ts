import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth, ApiQuery, ApiBody, ApiResponse } from '@nestjs/swagger';
import { OpTurnoversService } from './op-turnovers.service';
import { CreateOpTurnoverStampDto } from './dto/create-op-turnover-stamp.dto';
import { UpdateOpTurnoverStampDto } from './dto/update-op-turnover-stamp.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { API_ENVELOPE_SCHEMA } from '../../common/swagger/api-envelope.schema';

@ApiTags('op-turnover-stamps')
@ApiBearerAuth('JWT')
@Controller('op-turnover-stamps')
export class OpTurnoverStampsController {
  constructor(private readonly opTurnoversService: OpTurnoversService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'CrÃ©er un timbre / version de CA' })
  @ApiBody({ type: CreateOpTurnoverStampDto })
  @ApiResponse({ status: HttpStatus.CREATED, schema: API_ENVELOPE_SCHEMA })
  async create(@Body() dto: CreateOpTurnoverStampDto, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    const data = await this.opTurnoversService.createStamp(dto, companyId);
    return { success: true, message: 'Op turnover stamp created successfully', data };
  }

  @Get()
  @ApiOperation({ summary: 'Lister les timbres dâ€™un chiffre dâ€™affaires' })
  @ApiQuery({ name: 'opTurnoverId', required: true, type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findAll(@Query('opTurnoverId') opTurnoverId: string, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    if (!opTurnoverId) throw new BadRequestException('opTurnoverId query parameter is required');
    const data = await this.opTurnoversService.findAllStamps(opTurnoverId, companyId);
    return { success: true, message: 'Op turnover stamps retrieved successfully', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'DÃ©tail dâ€™un timbre' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    const data = await this.opTurnoversService.findOneStamp(id, companyId);
    return { success: true, message: 'Op turnover stamp retrieved successfully', data };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Mettre Ã  jour un timbre' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateOpTurnoverStampDto })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async update(@Param('id') id: string, @Body() dto: UpdateOpTurnoverStampDto, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    const data = await this.opTurnoversService.updateStamp(id, dto, companyId);
    return { success: true, message: 'Op turnover stamp updated successfully', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un timbre (soft delete)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) throw new BadRequestException('User must belong to a company');
    const data = await this.opTurnoversService.removeStamp(id, companyId);
    return { success: true, message: 'Op turnover stamp deleted successfully', data };
  }
}
