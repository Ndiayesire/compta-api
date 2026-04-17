import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { AppMetaService } from './app-meta.service';
import { CreateAppMetaDto } from './dto/create-app-meta.dto';
import { UpdateAppMetaDto } from './dto/update-app-meta.dto';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('app-meta')
@ApiBearerAuth('JWT')
@Controller('app-meta')
export class AppMetaController {
  constructor(private readonly appMetaService: AppMetaService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Create meta entry (key/value, table `meta`)' })
  async create(@Body() dto: CreateAppMetaDto) {
    const data = await this.appMetaService.create(dto);
    return {
      success: true,
      message: 'Meta entry created successfully',
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List meta entries (non-deleted)' })
  async findAll() {
    const data = await this.appMetaService.findAll();
    return {
      success: true,
      message: 'Meta entries retrieved successfully',
      data,
    };
  }

  @Get('by-key/:key')
  @ApiOperation({ summary: 'Get meta entry by key' })
  @ApiParam({ name: 'key', type: String })
  async findByKey(@Param('key') key: string) {
    const data = await this.appMetaService.findByKey(key);
    return {
      success: true,
      message: 'Meta entry retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get meta entry by numeric ID' })
  @ApiParam({ name: 'id', type: Number })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.appMetaService.findOne(id);
    return {
      success: true,
      message: 'Meta entry retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Update meta entry' })
  @ApiParam({ name: 'id', type: Number })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAppMetaDto,
  ) {
    const data = await this.appMetaService.update(id, dto);
    return {
      success: true,
      message: 'Meta entry updated successfully',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete meta entry' })
  @ApiParam({ name: 'id', type: Number })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const data = await this.appMetaService.remove(id);
    return {
      success: true,
      message: 'Meta entry deleted successfully',
      data,
    };
  }
}
