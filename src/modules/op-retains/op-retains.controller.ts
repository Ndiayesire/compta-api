import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth, ApiQuery, ApiBody, ApiResponse } from '@nestjs/swagger';
import { OpRetainsService } from './op-retains.service';
import { CreateOpRetainDto } from './dto/create-op-retain.dto';
import { UpdateOpRetainDto } from './dto/update-op-retain.dto';
import { API_ENVELOPE_SCHEMA } from '../../common/swagger/api-envelope.schema';

@ApiTags('op-retains')
@ApiBearerAuth('JWT')
@Controller('op-retains')
export class OpRetainsController {
  constructor(private readonly opRetainsService: OpRetainsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Créer une retenue' })
  @ApiBody({ type: CreateOpRetainDto })
  @ApiResponse({ status: HttpStatus.CREATED, schema: API_ENVELOPE_SCHEMA })
  async create(@Body() dto: CreateOpRetainDto) {
    const data = await this.opRetainsService.create(dto);
    return { success: true, message: 'Op retain created successfully', data };
  }

  @Get()
  @ApiOperation({ summary: 'Lister les retenues' })
  @ApiQuery({ name: 'tierId', required: false, type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findAll(@Query('tierId') tierId?: string) {
    const data = await this.opRetainsService.findAll(tierId);
    return { success: true, message: 'Op retains retrieved successfully', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’une retenue' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async findOne(@Param('id') id: string) {
    const data = await this.opRetainsService.findOne(id);
    return { success: true, message: 'Op retain retrieved successfully', data };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Mettre à jour une retenue' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateOpRetainDto })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async update(@Param('id') id: string, @Body() dto: UpdateOpRetainDto) {
    const data = await this.opRetainsService.update(id, dto);
    return { success: true, message: 'Op retain updated successfully', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une retenue (soft delete)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, schema: API_ENVELOPE_SCHEMA })
  async remove(@Param('id') id: string) {
    const data = await this.opRetainsService.remove(id);
    return { success: true, message: 'Op retain deleted successfully', data };
  }
}
