import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { ClientFlagService } from './client-flag.service';
import { CreateFlagClientDto } from './dto/create-flag-client.dto';
import { UpdateFlagClientDto } from './dto/update-flag-client.dto';

@ApiTags('client-flags')
@ApiBearerAuth('JWT')
@Controller('client-flags')
export class ClientFlagController {
  constructor(private readonly flagService: ClientFlagService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new flag client' })
  @ApiBody({ type: CreateFlagClientDto })
  @ApiResponse({ status: 201, description: 'Flag client created successfully' })
  async create(@Body() dto: CreateFlagClientDto) {
    const data = await this.flagService.create(dto);
    return { success: true, message: 'Flag client created successfully', data };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all flag clients' })
  async findAll() {
    const data = await this.flagService.findAll();
    return { success: true, message: 'Flag clients retrieved successfully', data };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a flag client by ID' })
  @ApiParam({ name: 'id', description: 'Flag client ID', example: 'flagclient-uuid-123' })
  async findOne(@Param('id') id: string) {
    const data = await this.flagService.findOne(id);
    return { success: true, message: 'Flag client retrieved successfully', data };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a flag client' })
  @ApiParam({ name: 'id', description: 'Flag client ID', example: 'flagclient-uuid-123' })
  @ApiBody({ type: UpdateFlagClientDto })
  async update(@Param('id') id: string, @Body() dto: UpdateFlagClientDto) {
    const data = await this.flagService.update(id, dto);
    return { success: true, message: 'Flag client updated successfully', data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a flag client' })
  @ApiParam({ name: 'id', description: 'Flag client ID', example: 'flagclient-uuid-123' })
  async remove(@Param('id') id: string) {
    const data = await this.flagService.remove(id);
    return { success: true, message: 'Flag client deactivated successfully', data };
  }
}