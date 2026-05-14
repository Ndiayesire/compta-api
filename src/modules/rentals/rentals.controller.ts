import { BadRequestException, Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UsePipes, ValidationPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth, ApiQuery, ApiBody, ApiResponse } from '@nestjs/swagger';
import { RentalsService } from './rentals.service';
import { CreateRentalDto } from './dto/create-rental.dto';
import { UpdateRentalDto } from './dto/update-rental.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { API_ENVELOPE_SCHEMA } from '../../common/swagger/api-envelope.schema';

@ApiTags('rentals')
@ApiBearerAuth('JWT')
@Controller('rentals')
export class RentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Créer une location / bien',
    description:
      '`client_id` doit appartenir à la société du JWT. `rental_usage_id` doit exister. `value` : montant décimal (12,2). `meta` : JSON libre.',
  })
  @ApiBody({ type: CreateRentalDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    schema: API_ENVELOPE_SCHEMA,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Client hors société, usage invalide, ou utilisateur sans société',
  })
  async create(@Body() dto: CreateRentalDto, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const data = await this.rentalsService.create(dto, companyId);
    return {
      success: true,
      message: 'Rental created successfully',
      data,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Lister les locations de la société',
    description:
      'Filtre optionnel `clientId` : UUID d’un client de votre `company_id`.',
  })
  @ApiQuery({
    name: 'clientId',
    required: false,
    description: 'UUID client (doit être dans votre société)',
    example: 'a0000021-0000-4000-8000-000000000001',
  })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Utilisateur sans société',
  })
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query('clientId') clientId?: string,
  ) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const data = await this.rentalsService.findAll(companyId, clientId);
    return {
      success: true,
      message: 'Rentals retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’une location' })
  @ApiParam({ name: 'id', description: 'UUID `rental_id`', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Inconnue ou hors société' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Utilisateur sans société',
  })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const data = await this.rentalsService.findOne(id, companyId);
    return {
      success: true,
      message: 'Rental retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Mettre à jour une location',
    description: 'Le `client_id` ne peut pas être modifié via ce DTO.',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateRentalDto })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Inconnue' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Données invalides' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRentalDto,
    @CurrentUser() user: AuthUser,
  ) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const data = await this.rentalsService.update(id, dto, companyId);
    return {
      success: true,
      message: 'Rental updated successfully',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer une location (soft delete)',
    description: 'Renseigne `rental_deleted_at`.',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Inconnue' })
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const data = await this.rentalsService.remove(id, companyId);
    return {
      success: true,
      message: 'Rental deleted successfully',
      data,
    };
  }
}
