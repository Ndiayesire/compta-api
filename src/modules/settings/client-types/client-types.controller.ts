import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { ClientTypesService } from './client-types.service';
import { CreateClientTypeDto } from './dto/create-client-type.dto';
import { UpdateClientTypeDto } from './dto/update-client-type.dto';

@ApiTags('client-types')
@Controller('client-types')
export class ClientTypesController {
  constructor(private readonly service: ClientTypesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new client type' })
  @ApiBody({ type: CreateClientTypeDto })
  @ApiResponse({
    status: 201,
    description: 'Client type created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Client type created successfully' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() dto: CreateClientTypeDto) {
    const data = await this.service.create(dto);
    return { success: true, message: 'Client type created successfully', data };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all client types' })
  @ApiResponse({
    status: 200,
    description: 'Client types retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Client types retrieved successfully' },
        data: { type: 'array' }
      }
    }
  })
  async findAll() {
    const data = await this.service.findAll();
    return { success: true, message: 'Client types retrieved successfully', data };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a client type by ID' })
  @ApiParam({ name: 'id', description: 'Client type ID', example: 'clienttype-uuid-123' })
  @ApiResponse({
    status: 200,
    description: 'Client type retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Client type retrieved successfully' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Client type not found' })
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOne(id);
    return { success: true, message: 'Client type retrieved successfully', data };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a client type' })
  @ApiParam({ name: 'id', description: 'Client type ID', example: 'clienttype-uuid-123' })
  @ApiBody({ type: UpdateClientTypeDto })
  @ApiResponse({
    status: 200,
    description: 'Client type updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Client type updated successfully' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Client type not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async update(@Param('id') id: string, @Body() dto: UpdateClientTypeDto) {
    const data = await this.service.update(id, dto);
    return { success: true, message: 'Client type updated successfully', data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a client type' })
  @ApiParam({ name: 'id', description: 'Client type ID', example: 'clienttype-uuid-123' })
  @ApiResponse({
    status: 200,
    description: 'Client type deactivated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Client type deactivated successfully' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Client type not found' })
  async remove(@Param('id') id: string) {
    const data = await this.service.remove(id);
    return { success: true, message: 'Client type deactivated successfully', data };
  }
}