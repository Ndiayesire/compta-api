import { Controller, Get, Post, Body, Param, Patch, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { LanguagesService } from './languages.service';
import { CreateLanguageDto } from './dto/create-language.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('languages')
@ApiBearerAuth('JWT')
@Controller('languages')
export class LanguagesController {
  constructor(private readonly languagesService: LanguagesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create language (settings_languages)' })
  @ApiResponse({ status: 201, description: 'Created successfully' })
  @ApiResponse({ status: 400, description: 'Duplicate name or code' })
  async create(@Body() dto: CreateLanguageDto) {
    const data = await this.languagesService.create(dto);
    return {
      success: true,
      message: 'Language created successfully',
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all languages' })
  @ApiResponse({ status: 200, description: 'OK' })
  async findAll() {
    const data = await this.languagesService.findAll();
    return {
      success: true,
      message: 'Languages retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get language by ID' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string) {
    const data = await this.languagesService.findOne(id);
    return {
      success: true,
      message: 'Language retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update language' })
  @ApiParam({ name: 'id', type: String })
  async update(@Param('id') id: string, @Body() dto: UpdateLanguageDto) {
    const data = await this.languagesService.update(id, dto);
    return {
      success: true,
      message: 'Language updated successfully',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate language (isActive = false)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 400, description: 'Still referenced by users' })
  async remove(@Param('id') id: string) {
    const data = await this.languagesService.remove(id);
    return {
      success: true,
      message: 'Language deactivated successfully',
      data,
    };
  }
}
