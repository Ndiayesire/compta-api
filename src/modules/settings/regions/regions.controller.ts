import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { RegionsService } from './regions.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';

@ApiTags('regions')
@ApiBearerAuth('JWT')
@Controller('regions')
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new region' })
  @ApiBody({ type: CreateRegionDto })
  @ApiResponse({
    status: 201,
    description: 'Region created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Region created successfully' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() dto: CreateRegionDto) {
    const data = await this.regionsService.create(dto);
    return { success: true, message: 'Region created successfully', data };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all regions' })
  @ApiResponse({
    status: 200,
    description: 'Regions retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Regions retrieved successfully' },
        data: { type: 'array' }
      }
    }
  })
  async findAll() {
    const data = await this.regionsService.findAll();
    return { success: true, message: 'Regions retrieved successfully', data };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a region by ID' })
  @ApiParam({ name: 'id', description: 'Region ID', example: 'region-uuid-123' })
  @ApiResponse({
    status: 200,
    description: 'Region retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Region retrieved successfully' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Region not found' })
  async findOne(@Param('id') id: string) {
    const data = await this.regionsService.findOne(id);
    return { success: true, message: 'Region retrieved successfully', data };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a region' })
  @ApiParam({ name: 'id', description: 'Region ID', example: 'region-uuid-123' })
  @ApiBody({ type: UpdateRegionDto })
  @ApiResponse({
    status: 200,
    description: 'Region updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Region updated successfully' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Region not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async update(@Param('id') id: string, @Body() dto: UpdateRegionDto) {
    const data = await this.regionsService.update(id, dto);
    return { success: true, message: 'Region updated successfully', data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a region' })
  @ApiParam({ name: 'id', description: 'Region ID', example: 'region-uuid-123' })
  @ApiResponse({
    status: 200,
    description: 'Region deactivated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Region deactivated successfully' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Region not found' })
  async remove(@Param('id') id: string) {
    const data = await this.regionsService.remove(id);
    return { success: true, message: 'Region deactivated successfully', data };
  }
}
