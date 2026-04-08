import { Controller, Get, Post, Patch, Body, Param, HttpCode, HttpStatus, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt/jwt-auth.guard';
import { CurrencyService } from './currency.service';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';

@ApiTags('currencies')
@Controller('currencies')
@UseGuards(JwtAuthGuard)
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}


  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new currency' })
  @ApiBody({ type: CreateCurrencyDto })
  @ApiResponse({
    status: 201,
    description: 'Currency created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() dto: CreateCurrencyDto) {
    const data = await this.currencyService.create(dto);

    return {
      success: true,
      message: 'Currency created successfully',
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all currencies' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Currencies fetched successfully',
  })
  async findAll(
    @Query('includeInactive') includeInactive?: string,
  ) {
    const data = await this.currencyService.findAll();
    return {
      success: true,
      message: 'Currencies fetched successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get currency by ID' })
  @ApiParam({ name: 'id', description: 'Currency ID' })
  @ApiResponse({
    status: 200,
    description: 'Currency fetched successfully',
  })
  @ApiResponse({ status: 404, description: 'Currency not found' })
  async findOne(@Param('id') id: string) {
    const data = await this.currencyService.findOne(id);

    return {
      success: true,
      message: 'Currency fetched successfully',
      data,
    };
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get currency by code' })
  @ApiParam({ name: 'code', description: 'Currency code (XOF, EUR...)' })
  async findByCode(@Param('code') code: string) {
    const data = await this.currencyService.findByCode(code);

    return {
      success: true,
      message: 'Currency fetched successfully',
      data,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update currency' })
  @ApiParam({ name: 'id', description: 'Currency ID' })
  @ApiBody({ type: UpdateCurrencyDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCurrencyDto,
  ) {
    const data = await this.currencyService.update(id, dto);

    return {
      success: true,
      message: 'Currency updated successfully',
      data,
    };
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate currency' })
  @ApiParam({ name: 'id', description: 'Currency ID' })
  async deactivate(@Param('id') id: string) {
    const data = await this.currencyService.remove(id);

    return {
      success: true,
      message: 'Currency deactivated successfully',
      data,
    };
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate currency' })
  @ApiParam({ name: 'id', description: 'Currency ID' })
  async activate(@Param('id') id: string) {
    const data = await this.currencyService.activate(id);

    return {
      success: true,
      message: 'Currency activated successfully',
      data,
    };
  }
}