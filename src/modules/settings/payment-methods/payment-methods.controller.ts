import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentMethodsService } from './payment-methods.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';

@ApiTags('payment-methods')
@ApiBearerAuth('JWT')
@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new payment method' })
  @ApiBody({ type: CreatePaymentMethodDto })
  @ApiResponse({
    status: 201,
    description: 'Payment method created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Payment method created successfully' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() dto: CreatePaymentMethodDto) {
    const data = await this.paymentMethodsService.create(dto);
    return { success: true, message: 'Payment method created successfully', data };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all payment methods' })
  @ApiResponse({
    status: 200,
    description: 'Payment methods retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Payment methods retrieved successfully' },
        data: { type: 'array' }
      }
    }
  })
  async findAll() {
    const data = await this.paymentMethodsService.findAll();
    return { success: true, message: 'Payment methods retrieved successfully', data };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a payment method by ID' })
  @ApiParam({ name: 'id', description: 'Payment method ID', example: 'payment-method-uuid-123' })
  @ApiResponse({
    status: 200,
    description: 'Payment method retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Payment method retrieved successfully' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Payment method not found' })
  async findOne(@Param('id') id: string) {
    const data = await this.paymentMethodsService.findOne(id);
    return { success: true, message: 'Payment method retrieved successfully', data };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a payment method' })
  @ApiParam({ name: 'id', description: 'Payment method ID', example: 'payment-method-uuid-123' })
  @ApiBody({ type: UpdatePaymentMethodDto })
  @ApiResponse({
    status: 200,
    description: 'Payment method updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Payment method updated successfully' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Payment method not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async update(@Param('id') id: string, @Body() dto: UpdatePaymentMethodDto) {
    const data = await this.paymentMethodsService.update(id, dto);
    return { success: true, message: 'Payment method updated successfully', data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a payment method' })
  @ApiParam({ name: 'id', description: 'Payment method ID', example: 'payment-method-uuid-123' })
  @ApiResponse({
    status: 200,
    description: 'Payment method deactivated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Payment method deactivated successfully' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Payment method not found' })
  async remove(@Param('id') id: string) {
    const data = await this.paymentMethodsService.remove(id);
    return { success: true, message: 'Payment method deactivated successfully', data };
  }
}