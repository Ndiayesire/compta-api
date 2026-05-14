import { Controller, Get, Post, Body, Param, Patch, Delete, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { DocumentCategoriesService } from './document-categories.service';
import { CreateDocumentCategoryDto } from './dto/create-document-category.dto';
import { UpdateDocumentCategoryDto } from './dto/update-document-category.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('document-categories')
@ApiBearerAuth('JWT')
@Controller('document-categories')
export class DocumentCategoriesController {
  constructor(
    private readonly documentCategoriesService: DocumentCategoriesService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Create document category (document_categories)' })
  @ApiResponse({ status: 201, description: 'Created' })
  async create(@Body() dto: CreateDocumentCategoryDto) {
    const data = await this.documentCategoriesService.create(dto);
    return {
      success: true,
      message: 'Document category created successfully',
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List document categories (non-deleted)' })
  async findAll() {
    const data = await this.documentCategoriesService.findAll();
    return {
      success: true,
      message: 'Document categories retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document category by ID' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string) {
    const data = await this.documentCategoriesService.findOne(id);
    return {
      success: true,
      message: 'Document category retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Update document category' })
  @ApiParam({ name: 'id', type: String })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentCategoryDto,
  ) {
    const data = await this.documentCategoriesService.update(id, dto);
    return {
      success: true,
      message: 'Document category updated successfully',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Soft-delete document category (sets deletedAt)',
    description: 'Fails if non-deleted documents still use this category.',
  })
  @ApiParam({ name: 'id', type: String })
  async remove(@Param('id') id: string) {
    const data = await this.documentCategoriesService.remove(id);
    return {
      success: true,
      message: 'Document category deleted successfully',
      data,
    };
  }
}
