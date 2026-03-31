import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus} from '@nestjs/common';
import { LegalFormsService } from './legal-forms.service';
import { CreateLegalFormDto } from './dto/create-legal-form.dto';
import { UpdateLegalFormDto } from './dto/update-legal-form.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';


@ApiTags('legal-forms')
// @ApiBearerAuth()
@Controller('legal-forms')
export class LegalFormsController {
  constructor(
    private readonly legalFormsService: LegalFormsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a legal form' })
  @ApiResponse({ status: 201, description: 'Legal form created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Legal form already exists' })
  async create(@Body() dto: CreateLegalFormDto) {
    const data = await this.legalFormsService.create(dto);
    return {
      success: true,
      message: 'Legal form created successfully',
      data,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all legal forms' })
  @ApiResponse({ status: 200, description: 'Legal forms retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll() {
    const data = await this.legalFormsService.findAll();
    return {
      success: true,
      message: 'Legal forms retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a legal form by ID' })
  @ApiParam({
    name: 'id',
    description: 'Legal form UUID',
    example: 'uuid-123',
  })
  @ApiResponse({ status: 200, description: 'Legal form retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Legal form not found' })
  async findOne(@Param('id') id: string) {
    const data = await this.legalFormsService.findOne(id);
    return {
      success: true,
      message: 'Legal form retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a legal form' })
  @ApiParam({
    name: 'id',
    description: 'Legal form UUID',
    example: 'uuid-123',
  })
  @ApiResponse({ status: 200, description: 'Legal form updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Legal form not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLegalFormDto,
  ) {
    const data = await this.legalFormsService.update(id, dto);
    return {
      success: true,
      message: 'Legal form updated successfully',
      data,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a legal form' })
  @ApiParam({
    name: 'id',
    description: 'Legal form UUID',
    example: 'uuid-123',
  })
  @ApiResponse({ status: 200, description: 'Legal form deactivated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Legal form not found' })
  async remove(@Param('id') id: string) {
    const data = await this.legalFormsService.remove(id);
    return {
      success: true,
      message: 'Legal form deactivated successfully',
      data,
    };
  }
}