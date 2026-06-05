import { Controller, Get, Post, Body, Param, Patch, Delete, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger';
import { ProvidersService } from './providers.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { API_ENVELOPE_SCHEMA } from '../../common/swagger/api-envelope.schema';

@ApiTags('providers')
@ApiBearerAuth('JWT')
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Créer un fournisseur' })
  @ApiBody({ type: CreateProviderDto })
  @ApiResponse({ status: HttpStatus.CREATED, schema: API_ENVELOPE_SCHEMA })
  async create(@Body() dto: CreateProviderDto) {
    const data = await this.providersService.create(dto);
    return { success: true, message: 'Provider created successfully', data };
  }

  @Get()
  @ApiOperation({ summary: 'Lister les fournisseurs' })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findAll() {
    const data = await this.providersService.findAll();
    return { success: true, message: 'Providers retrieved successfully', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’un fournisseur' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findOne(@Param('id') id: string) {
    const data = await this.providersService.findOne(id);
    return { success: true, message: 'Provider retrieved successfully', data };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Mettre à jour un fournisseur' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateProviderDto })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async update(@Param('id') id: string, @Body() dto: UpdateProviderDto) {
    const data = await this.providersService.update(id, dto);
    return { success: true, message: 'Provider updated successfully', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un fournisseur (soft delete)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async remove(@Param('id') id: string) {
    const data = await this.providersService.remove(id);
    return { success: true, message: 'Provider deleted successfully', data };
  }
}
