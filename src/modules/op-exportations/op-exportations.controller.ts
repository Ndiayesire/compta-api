import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth, ApiQuery, ApiBody, ApiResponse } from '@nestjs/swagger';
import { OpExportationsService } from './op-exportations.service';
import { CreateOpExportationDto } from './dto/create-op-exportation.dto';
import { UpdateOpExportationDto } from './dto/update-op-exportation.dto';
import { API_ENVELOPE_SCHEMA } from '../../common/swagger/api-envelope.schema';

@ApiTags('op-exportations')
@ApiBearerAuth('JWT')
@Controller('op-exportations')
export class OpExportationsController {
  constructor(private readonly opExportationsService: OpExportationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Créer une exportation' })
  @ApiBody({ type: CreateOpExportationDto })
  @ApiResponse({ status: HttpStatus.CREATED, schema: API_ENVELOPE_SCHEMA })
  async create(@Body() dto: CreateOpExportationDto) {
    const data = await this.opExportationsService.create(dto);
    return { success: true, message: 'Op exportation created successfully', data };
  }

  @Get()
  @ApiOperation({ summary: 'Lister les exportations' })
  @ApiQuery({ name: 'tierId', required: false, type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findAll(@Query('tierId') tierId?: string) {
    const data = await this.opExportationsService.findAll(tierId);
    return { success: true, message: 'Op exportations retrieved successfully', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’une exportation' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findOne(@Param('id') id: string) {
    const data = await this.opExportationsService.findOne(id);
    return { success: true, message: 'Op exportation retrieved successfully', data };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Mettre à jour une exportation' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateOpExportationDto })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async update(@Param('id') id: string, @Body() dto: UpdateOpExportationDto) {
    const data = await this.opExportationsService.update(id, dto);
    return { success: true, message: 'Op exportation updated successfully', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une exportation (soft delete)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async remove(@Param('id') id: string) {
    const data = await this.opExportationsService.remove(id);
    return { success: true, message: 'Op exportation deleted successfully', data };
  }
}
