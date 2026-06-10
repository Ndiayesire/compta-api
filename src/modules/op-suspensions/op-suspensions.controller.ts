import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth, ApiQuery, ApiBody, ApiResponse } from '@nestjs/swagger';
import { OpSuspensionsService } from './op-suspensions.service';
import { CreateOpSuspensionDto } from './dto/create-op-suspension.dto';
import { UpdateOpSuspensionDto } from './dto/update-op-suspension.dto';
import { API_ENVELOPE_SCHEMA } from '../../common/swagger/api-envelope.schema';

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
