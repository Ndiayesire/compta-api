import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { ContractTypesService } from './contract-types.service';
import { CreateContractTypeDto } from './dto/create-contract-type.dto';
import { UpdateContractTypeDto } from './dto/update-contract-type.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('contract-types')
@Controller('contract-types')
export class ContractTypesController {
  constructor(private readonly contractTypesService: ContractTypesService) {}

  @Post()
  @ApiOperation({ summary: 'Create contract type' })
  @ApiResponse({ status: 201, description: 'Created successfully' })
  async create(@Body() dto: CreateContractTypeDto) {
    const data = await this.contractTypesService.create(dto);

    return {
      success: true,
      message: 'Contract type created successfully',
      data,
    };
  }

  @Get()
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get all contract types' })
  @ApiResponse({
    status: 200,
    description: 'Contract types retrieved successfully',
  })
  async findAll() {
    const data = await this.contractTypesService.findAll();

    return {
      success: true,
      message: 'Contract types retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get contract type by ID' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string) {
    const data = await this.contractTypesService.findOne(id);

    return {
      success: true,
      message: 'Contract type retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update contract type' })
  @ApiParam({ name: 'id', type: String })
  async update(@Param('id') id: string, @Body() dto: UpdateContractTypeDto) {
    const data = await this.contractTypesService.update(id, dto);

    return {
      success: true,
      message: 'Contract type updated successfully',
      data,
    };
  }

  @Delete(':id')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Deactivate contract type' })
  @ApiParam({ name: 'id', type: String })
  async remove(@Param('id') id: string) {
    const data = await this.contractTypesService.remove(id);

    return {
      success: true,
      message: 'Contract type deleted successfully',
      data,
    };
  }
}