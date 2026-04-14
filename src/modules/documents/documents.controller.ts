import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';

@ApiTags('documents')
@ApiBearerAuth('JWT')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  private companyIdOrThrow(user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return companyId;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Register a document (metadata; file stored at `path`)',
    description:
      '`company_id` is taken from the JWT user. Upload the binary separately, then send storage path and metadata here.',
  })
  async create(@Body() dto: CreateDocumentDto, @CurrentUser() user: AuthUser) {
    const companyId = this.companyIdOrThrow(user);
    const data = await this.documentsService.create(dto, companyId);
    return {
      success: true,
      message: 'Document created successfully',
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List documents for your company' })
  async findAll(@CurrentUser() user: AuthUser) {
    const companyId = this.companyIdOrThrow(user);
    const data = await this.documentsService.findAll(companyId);
    return {
      success: true,
      message: 'Documents retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document by ID' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const companyId = this.companyIdOrThrow(user);
    const data = await this.documentsService.findOne(id, companyId);
    return {
      success: true,
      message: 'Document retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Update document metadata' })
  @ApiParam({ name: 'id', type: String })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
    @CurrentUser() user: AuthUser,
  ) {
    const companyId = this.companyIdOrThrow(user);
    const data = await this.documentsService.update(id, dto, companyId);
    return {
      success: true,
      message: 'Document updated successfully',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete document' })
  @ApiParam({ name: 'id', type: String })
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const companyId = this.companyIdOrThrow(user);
    const data = await this.documentsService.remove(id, companyId);
    return {
      success: true,
      message: 'Document deleted successfully',
      data,
    };
  }
}
