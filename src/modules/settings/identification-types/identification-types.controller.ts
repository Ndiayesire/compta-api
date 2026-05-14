import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateIdentificationTypeDto } from './dto/create-identification-type.dto';
import { UpdateIdentificationTypeDto } from './dto/update-identification-type.dto';
import { IdentificationTypesService } from './identification-types.service';

@ApiTags('identification-types')
@ApiBearerAuth('JWT')
@Controller('identification-types')
export class IdentificationTypesController {
  constructor(
    private readonly identificationTypesService: IdentificationTypesService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Create identification type (settings_identification_type)',
  })
  @ApiResponse({ status: 201, description: 'Created' })
  async create(@Body() dto: CreateIdentificationTypeDto) {
    const data = await this.identificationTypesService.create(dto);
    return {
      success: true,
      message: 'Identification type created successfully',
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List identification types' })
  async findAll() {
    const data = await this.identificationTypesService.findAll();
    return {
      success: true,
      message: 'Identification types retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get identification type by ID' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string) {
    const data = await this.identificationTypesService.findOne(id);
    return {
      success: true,
      message: 'Identification type retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Update identification type' })
  @ApiParam({ name: 'id', type: String })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateIdentificationTypeDto,
  ) {
    const data = await this.identificationTypesService.update(id, dto);
    return {
      success: true,
      message: 'Identification type updated successfully',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete identification type',
    description:
      'Fails if non-deleted employees still reference this type.',
  })
  @ApiParam({ name: 'id', type: String })
  async remove(@Param('id') id: string) {
    const data = await this.identificationTypesService.remove(id);
    return {
      success: true,
      message: 'Identification type deleted successfully',
      data,
    };
  }
}
