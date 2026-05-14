import { Controller, Get, Post, Body, Param, Patch, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { GendersService } from './genders.service';
import { CreateGenderDto } from './dto/create-gender.dto';
import { UpdateGenderDto } from './dto/update-gender.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('genders')
@ApiBearerAuth('JWT')
@Controller('genders')
export class GendersController {
  constructor(private readonly gendersService: GendersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create gender (settings_genders)' })
  @ApiResponse({ status: 201, description: 'Created successfully' })
  @ApiResponse({ status: 400, description: 'Duplicate name or code' })
  async create(@Body() dto: CreateGenderDto) {
    const data = await this.gendersService.create(dto);
    return {
      success: true,
      message: 'Gender created successfully',
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all genders' })
  @ApiResponse({ status: 200, description: 'OK' })
  async findAll() {
    const data = await this.gendersService.findAll();
    return {
      success: true,
      message: 'Genders retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get gender by ID' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string) {
    const data = await this.gendersService.findOne(id);
    return {
      success: true,
      message: 'Gender retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update gender' })
  @ApiParam({ name: 'id', type: String })
  async update(@Param('id') id: string, @Body() dto: UpdateGenderDto) {
    const data = await this.gendersService.update(id, dto);
    return {
      success: true,
      message: 'Gender updated successfully',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate gender (isActive = false)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 400, description: 'Still referenced by users' })
  async remove(@Param('id') id: string) {
    const data = await this.gendersService.remove(id);
    return {
      success: true,
      message: 'Gender deactivated successfully',
      data,
    };
  }
}
