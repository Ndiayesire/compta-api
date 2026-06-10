import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth, ApiQuery, ApiBody, ApiResponse } from '@nestjs/swagger';
import { OpImportationsService } from './op-importations.service';
import { CreateOpImportationDto } from './dto/create-op-importation.dto';
import { UpdateOpImportationDto } from './dto/update-op-importation.dto';
import { API_ENVELOPE_SCHEMA } from '../../common/swagger/api-envelope.schema';

@ApiTags('op-importations')
@ApiBearerAuth('JWT')
@Controller('op-importations')
export class OpImportationsController {
  constructor(private readonly opImportationsService: OpImportationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Créer une importation' })
  @ApiBody({ type: CreateOpImportationDto })
  @ApiResponse({ status: HttpStatus.CREATED, schema: API_ENVELOPE_SCHEMA })
  async create(@Body() dto: CreateOpImportationDto) {
    const data = await this.opImportationsService.create(dto);
    return { success: true, message: 'Op importation created successfully', data };
  }

  @Get()
  @ApiOperation({ summary: 'Lister les importations' })
  @ApiQuery({ name: 'tierId', required: false, type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findAll(@Query('tierId') tierId?: string) {
    const data = await this.opImportationsService.findAll(tierId);
    return { success: true, message: 'Op importations retrieved successfully', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’une importation' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findOne(@Param('id') id: string) {
    const data = await this.opImportationsService.findOne(id);
    return { success: true, message: 'Op importation retrieved successfully', data };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Mettre à jour une importation' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateOpImportationDto })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async update(@Param('id') id: string, @Body() dto: UpdateOpImportationDto) {
    const data = await this.opImportationsService.update(id, dto);
    return { success: true, message: 'Op importation updated successfully', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une importation (soft delete)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async remove(@Param('id') id: string) {
    const data = await this.opImportationsService.remove(id);
    return { success: true, message: 'Op importation deleted successfully', data };
  }
}
