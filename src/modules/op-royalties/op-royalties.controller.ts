import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth, ApiQuery, ApiBody, ApiResponse } from '@nestjs/swagger';
import { OpRoyaltiesService } from './op-royalties.service';
import { CreateOpRoyaltyDto } from './dto/create-op-royalty.dto';
import { UpdateOpRoyaltyDto } from './dto/update-op-royalty.dto';
import { API_ENVELOPE_SCHEMA } from '../../common/swagger/api-envelope.schema';

@ApiTags('op-royalties')
@ApiBearerAuth('JWT')
@Controller('op-royalties')
export class OpRoyaltiesController {
  constructor(private readonly opRoyaltiesService: OpRoyaltiesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Créer une redevance' })
  @ApiBody({ type: CreateOpRoyaltyDto })
  @ApiResponse({ status: HttpStatus.CREATED, schema: API_ENVELOPE_SCHEMA })
  async create(@Body() dto: CreateOpRoyaltyDto) {
    const data = await this.opRoyaltiesService.create(dto);
    return { success: true, message: 'Op royalty created successfully', data };
  }

  @Get()
  @ApiOperation({ summary: 'Lister les redevances' })
  @ApiQuery({ name: 'tierId', required: false, type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findAll(@Query('tierId') tierId?: string) {
    const data = await this.opRoyaltiesService.findAll(tierId);
    return { success: true, message: 'Op royalties retrieved successfully', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’une redevance' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findOne(@Param('id') id: string) {
    const data = await this.opRoyaltiesService.findOne(id);
    return { success: true, message: 'Op royalty retrieved successfully', data };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Mettre à jour une redevance' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateOpRoyaltyDto })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async update(@Param('id') id: string, @Body() dto: UpdateOpRoyaltyDto) {
    const data = await this.opRoyaltiesService.update(id, dto);
    return { success: true, message: 'Op royalty updated successfully', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une redevance (soft delete)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async remove(@Param('id') id: string) {
    const data = await this.opRoyaltiesService.remove(id);
    return { success: true, message: 'Op royalty deleted successfully', data };
  }
}
