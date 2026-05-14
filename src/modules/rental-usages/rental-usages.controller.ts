import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger';
import { RentalUsagesService } from './rental-usages.service';
import { CreateRentalUsageDto } from './dto/create-rental-usage.dto';
import { UpdateRentalUsageDto } from './dto/update-rental-usage.dto';
import { API_ENVELOPE_SCHEMA } from '../../common/swagger/api-envelope.schema';

@ApiTags('rental-usages')
@ApiBearerAuth('JWT')
@Controller('rental-usages')
export class RentalUsagesController {
  constructor(private readonly rentalUsagesService: RentalUsagesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Créer un type d’usage location (catalogue)',
    description:
      'Table `rental_usages` : référencé par `rentals.rental_usage_id`. Pas de scope société.',
  })
  @ApiBody({ type: CreateRentalUsageDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Type créé',
    schema: API_ENVELOPE_SCHEMA,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation' })
  async create(@Body() dto: CreateRentalUsageDto) {
    const data = await this.rentalUsagesService.create(dto);
    return {
      success: true,
      message: 'Rental usage created successfully',
      data,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Lister les types d’usage',
    description: 'Tri par nom ascendant.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Liste',
    schema: API_ENVELOPE_SCHEMA,
  })
  async findAll() {
    const data = await this.rentalUsagesService.findAll();
    return {
      success: true,
      message: 'Rental usages retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’un type d’usage' })
  @ApiParam({ name: 'id', description: 'UUID `rental_usage_id`', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: API_ENVELOPE_SCHEMA,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Inconnu' })
  async findOne(@Param('id') id: string) {
    const data = await this.rentalUsagesService.findOne(id);
    return {
      success: true,
      message: 'Rental usage retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Mettre à jour un type d’usage' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateRentalUsageDto })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Inconnu' })
  async update(@Param('id') id: string, @Body() dto: UpdateRentalUsageDto) {
    const data = await this.rentalUsagesService.update(id, dto);
    return {
      success: true,
      message: 'Rental usage updated successfully',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer un type d’usage',
    description:
      'Impossible s’il existe des enregistrements `rentals` avec `deleted_at` null pointant vers ce type.',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Type inconnu',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Encore référencé par des locations actives',
  })
  async remove(@Param('id') id: string) {
    const data = await this.rentalUsagesService.remove(id);
    return {
      success: true,
      message: 'Rental usage deleted successfully',
      data,
    };
  }
}
