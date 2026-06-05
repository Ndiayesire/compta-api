import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { CountriesService } from './countries.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';

@ApiTags('countries')
@ApiBearerAuth('JWT')
@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new country' })
  @ApiBody({ type: CreateCountryDto })
  @ApiResponse({
    status: 201,
    description: 'Country created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Country created successfully' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() dto: CreateCountryDto) {
    const data = await this.countriesService.create(dto);
    return { success: true, message: 'Country created successfully', data };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all countries' })
  @ApiResponse({
    status: 200,
    description: 'Countries retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Countries retrieved successfully' },
        data: { type: 'array' }
      }
    }
  })
  async findAll() {
    const data = await this.countriesService.findAll();
    return { success: true, message: 'Countries retrieved successfully', data };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a country by ID' })
  @ApiParam({ name: 'id', description: 'Country ID', example: 'country-uuid-123' })
  @ApiResponse({
    status: 200,
    description: 'Country retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Country retrieved successfully' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Country not found' })
  async findOne(@Param('id') id: string) {
    const data = await this.countriesService.findOne(id);
    return { success: true, message: 'Country retrieved successfully', data };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a country' })
  @ApiParam({ name: 'id', description: 'Country ID', example: 'country-uuid-123' })
  @ApiBody({ type: UpdateCountryDto })
  @ApiResponse({
    status: 200,
    description: 'Country updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Country updated successfully' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Country not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async update(@Param('id') id: string, @Body() dto: UpdateCountryDto) {
    const data = await this.countriesService.update(id, dto);
    return { success: true, message: 'Country updated successfully', data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a country' })
  @ApiParam({ name: 'id', description: 'Country ID', example: 'country-uuid-123' })
  @ApiResponse({
    status: 200,
    description: 'Country deactivated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Country deactivated successfully' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Country not found' })
  async remove(@Param('id') id: string) {
    const data = await this.countriesService.remove(id);
    return { success: true, message: 'Country deactivated successfully', data };
  }
}
