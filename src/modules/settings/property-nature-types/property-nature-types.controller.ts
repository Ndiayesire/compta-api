import { Controller, Get, Post, Body, Param, Patch, Delete, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger';
import { PropertyNatureTypesService } from './property-nature-types.service';
import { CreatePropertyNatureTypeDto } from './dto/create-property-nature-type.dto';
import { UpdatePropertyNatureTypeDto } from './dto/update-property-nature-type.dto';
import { API_ENVELOPE_SCHEMA } from '../../../common/swagger/api-envelope.schema';

@ApiTags('property-nature-types')
@ApiBearerAuth('JWT')
@Controller('property-nature-types')
export class PropertyNatureTypesController {
  constructor(private readonly propertyNatureTypesService: PropertyNatureTypesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Créer un type de nature de bien' })
  @ApiBody({ type: CreatePropertyNatureTypeDto })
  @ApiResponse({ status: HttpStatus.CREATED, schema: API_ENVELOPE_SCHEMA })
  async create(@Body() dto: CreatePropertyNatureTypeDto) {
    const data = await this.propertyNatureTypesService.create(dto);
    return { success: true, message: 'Property nature type created successfully', data };
  }

  @Get()
  @ApiOperation({ summary: 'Lister les types de nature de bien' })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findAll() {
    const data = await this.propertyNatureTypesService.findAll();
    return { success: true, message: 'Property nature types retrieved successfully', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’un type de nature de bien' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findOne(@Param('id') id: string) {
    const data = await this.propertyNatureTypesService.findOne(id);
    return { success: true, message: 'Property nature type retrieved successfully', data };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Mettre à jour un type de nature de bien' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdatePropertyNatureTypeDto })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async update(@Param('id') id: string, @Body() dto: UpdatePropertyNatureTypeDto) {
    const data = await this.propertyNatureTypesService.update(id, dto);
    return { success: true, message: 'Property nature type updated successfully', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un type de nature de bien (soft delete)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async remove(@Param('id') id: string) {
    const data = await this.propertyNatureTypesService.remove(id);
    return { success: true, message: 'Property nature type deleted successfully', data };
  }
}
