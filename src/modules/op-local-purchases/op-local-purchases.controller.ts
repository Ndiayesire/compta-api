import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth, ApiQuery, ApiBody, ApiResponse } from '@nestjs/swagger';
import { OpLocalPurchasesService } from './op-local-purchases.service';
import { CreateOpLocalPurchaseDto } from './dto/create-op-local-purchase.dto';
import { UpdateOpLocalPurchaseDto } from './dto/update-op-local-purchase.dto';
import { API_ENVELOPE_SCHEMA } from '../../common/swagger/api-envelope.schema';

@ApiTags('op-local-purchases')
@ApiBearerAuth('JWT')
@Controller('op-local-purchases')
export class OpLocalPurchasesController {
  constructor(private readonly opLocalPurchasesService: OpLocalPurchasesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Créer un achat local' })
  @ApiBody({ type: CreateOpLocalPurchaseDto })
  @ApiResponse({ status: HttpStatus.CREATED, schema: API_ENVELOPE_SCHEMA })
  async create(@Body() dto: CreateOpLocalPurchaseDto) {
    const data = await this.opLocalPurchasesService.create(dto);
    return { success: true, message: 'Op local purchase created successfully', data };
  }

  @Get()
  @ApiOperation({ summary: 'Lister les achats locaux' })
  @ApiQuery({ name: 'tierId', required: false, type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findAll(@Query('tierId') tierId?: string) {
    const data = await this.opLocalPurchasesService.findAll(tierId);
    return { success: true, message: 'Op local purchases retrieved successfully', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’un achat local' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findOne(@Param('id') id: string) {
    const data = await this.opLocalPurchasesService.findOne(id);
    return { success: true, message: 'Op local purchase retrieved successfully', data };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Mettre à jour un achat local' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateOpLocalPurchaseDto })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async update(@Param('id') id: string, @Body() dto: UpdateOpLocalPurchaseDto) {
    const data = await this.opLocalPurchasesService.update(id, dto);
    return { success: true, message: 'Op local purchase updated successfully', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un achat local (soft delete)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async remove(@Param('id') id: string) {
    const data = await this.opLocalPurchasesService.remove(id);
    return { success: true, message: 'Op local purchase deleted successfully', data };
  }
}
