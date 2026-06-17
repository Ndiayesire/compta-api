import { Controller, Get, Post, Body, Param, Patch, Delete, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger';
import { DeductionTypesService } from './deduction-types.service';
import { CreateDeductionTypeDto } from './dto/create-deduction-type.dto';
import { UpdateDeductionTypeDto } from './dto/update-deduction-type.dto';
import { API_ENVELOPE_SCHEMA } from '../../../common/swagger/api-envelope.schema';

@ApiTags('deduction-types')
@ApiBearerAuth('JWT')
@Controller('deduction-types')
export class DeductionTypesController {
  constructor(private readonly deductionTypesService: DeductionTypesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Créer un type de déduction',
    description:
      'Référentiel `deduction_types`. Utilisé par les importations (`op_importations`) : à l’import Excel, un libellé inconnu est créé automatiquement avec un code abrégé.',
  })
  @ApiBody({ type: CreateDeductionTypeDto })
  @ApiResponse({ status: HttpStatus.CREATED, schema: API_ENVELOPE_SCHEMA })
  async create(@Body() dto: CreateDeductionTypeDto) {
    const data = await this.deductionTypesService.create(dto);
    return { success: true, message: 'Deduction type created successfully', data };
  }

  @Get()
  @ApiOperation({ summary: 'Lister les types de déduction' })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findAll() {
    const data = await this.deductionTypesService.findAll();
    return { success: true, message: 'Deduction types retrieved successfully', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’un type de déduction' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findOne(@Param('id') id: string) {
    const data = await this.deductionTypesService.findOne(id);
    return { success: true, message: 'Deduction type retrieved successfully', data };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Mettre à jour un type de déduction' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateDeductionTypeDto })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async update(@Param('id') id: string, @Body() dto: UpdateDeductionTypeDto) {
    const data = await this.deductionTypesService.update(id, dto);
    return { success: true, message: 'Deduction type updated successfully', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un type de déduction (soft delete)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async remove(@Param('id') id: string) {
    const data = await this.deductionTypesService.remove(id);
    return { success: true, message: 'Deduction type deleted successfully', data };
  }
}
