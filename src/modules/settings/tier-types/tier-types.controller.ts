import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TierTypesService } from './tier-types.service';
import { CreateTierTypeDto } from './dto/create-tier-type.dto';
import { UpdateTierTypeDto } from './dto/update-tier-type.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('tier-types')
@ApiBearerAuth('JWT')
@Controller('tier-types')
export class TierTypesController {
  constructor(private readonly tierTypesService: TierTypesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create tier type (settings_tier_types)' })
  @ApiResponse({ status: 201, description: 'Created successfully' })
  @ApiResponse({ status: 400, description: 'Duplicate name or code' })
  async create(@Body() dto: CreateTierTypeDto) {
    const data = await this.tierTypesService.create(dto);
    return {
      success: true,
      message: 'Tier type created successfully',
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all tier types' })
  async findAll() {
    const data = await this.tierTypesService.findAll();
    return {
      success: true,
      message: 'Tier types retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tier type by ID' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string) {
    const data = await this.tierTypesService.findOne(id);
    return {
      success: true,
      message: 'Tier type retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update tier type' })
  @ApiParam({ name: 'id', type: String })
  async update(@Param('id') id: string, @Body() dto: UpdateTierTypeDto) {
    const data = await this.tierTypesService.update(id, dto);
    return {
      success: true,
      message: 'Tier type updated successfully',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate tier type (isActive = false)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 400, description: 'Referenced by tiers' })
  async remove(@Param('id') id: string) {
    const data = await this.tierTypesService.remove(id);
    return {
      success: true,
      message: 'Tier type deactivated successfully',
      data,
    };
  }
}
