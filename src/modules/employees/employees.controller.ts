import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { EmployeeService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employees.dto';
import { UpdateEmployeeDto } from './dto/update-employees.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('employees')
@Controller('employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  @ApiOperation({ summary: 'Create employee' })
  @ApiResponse({
    status: 201,
    description: 'Employee created successfully',
  })
  async create(@Body() dto: CreateEmployeeDto) {
    const data = await this.employeeService.create(dto);

    return {
      success: true,
      message: 'Employee created successfully',
      data,
    };
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'Get employees by client' })
  @ApiParam({ name: 'clientId', type: String })
  @ApiResponse({
    status: 200,
    description: 'Client employees retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Client employees retrieved successfully',
        },
        data: {
          type: 'array',
          items: { type: 'object' },
        },
      },
    },
  })
  async findByClient(@Param('clientId') clientId: string) {
    const data = await this.employeeService.findByClient(clientId);

    return {
      success: true,
      message: 'Client employees retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Employee retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Employee retrieved successfully',
        },
        data: { type: 'object' },
      },
    },
  })
  async findOne(@Param('id') id: string) {
    const data = await this.employeeService.findOne(id);

    return {
      success: true,
      message: 'Employee retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update employee' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Employee updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Employee updated successfully',
        },
        data: { type: 'object' },
      },
    },
  })
  async update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    const data = await this.employeeService.update(id, dto);

    return {
      success: true,
      message: 'Employee updated successfully',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete employee' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Employee deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Employee deleted successfully',
        },
        data: { type: 'object' },
      },
    },
  })
  async remove(@Param('id') id: string) {
    const data = await this.employeeService.remove(id);

    return {
      success: true,
      message: 'Employee deleted successfully',
      data,
    };
  }
}