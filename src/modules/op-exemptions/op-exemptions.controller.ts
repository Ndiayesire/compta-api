import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth, ApiQuery, ApiBody, ApiResponse } from '@nestjs/swagger';
import { OpExemptionsService } from './op-exemptions.service';
import { CreateOpExemptionDto } from './dto/create-op-exemption.dto';
import { UpdateOpExemptionDto } from './dto/update-op-exemption.dto';
import { API_ENVELOPE_SCHEMA } from '../../common/swagger/api-envelope.schema';

@ApiTags('op-exemptions')
@ApiBearerAuth('JWT')
@Controller('op-exemptions')
export class OpExemptionsController {
  constructor(private readonly opExemptionsService: OpExemptionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Créer une exonération' })
  @ApiBody({ type: CreateOpExemptionDto })
  @ApiResponse({ status: HttpStatus.CREATED, schema: API_ENVELOPE_SCHEMA })
  async create(@Body() dto: CreateOpExemptionDto) {
    const data = await this.opExemptionsService.create(dto);
    return { success: true, message: 'Op exemption created successfully', data };
  }

  @Get()
  @ApiOperation({ summary: 'Lister les exonérations' })
  @ApiQuery({ name: 'tierId', required: false, type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findAll(@Query('tierId') tierId?: string) {
    const data = await this.opExemptionsService.findAll(tierId);
    return { success: true, message: 'Op exemptions retrieved successfully', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’une exonération' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findOne(@Param('id') id: string) {
    const data = await this.opExemptionsService.findOne(id);
    return { success: true, message: 'Op exemption retrieved successfully', data };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Mettre à jour une exonération' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateOpExemptionDto })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async update(@Param('id') id: string, @Body() dto: UpdateOpExemptionDto) {
    const data = await this.opExemptionsService.update(id, dto);
    return { success: true, message: 'Op exemption updated successfully', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une exonération (soft delete)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async remove(@Param('id') id: string) {
    const data = await this.opExemptionsService.remove(id);
    return { success: true, message: 'Op exemption deleted successfully', data };
  }
}
