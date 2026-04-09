import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt/jwt-auth.guard';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionEntity } from './entities/permission.entity';

@ApiTags('permissions')
@ApiBearerAuth('JWT')
@Controller('permissions')
@UseGuards(JwtAuthGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiBody({ type: CreatePermissionDto })
  @ApiResponse({
    status: 201,
    description: 'Permission created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Permission created successfully' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() dto: CreatePermissionDto) {
    const data = await this.permissionsService.create(dto);
    return { success: true, message: 'Permission created successfully', data };
  }

  // @Post('seed')
  // @HttpCode(HttpStatus.CREATED)
  // @ApiOperation({ summary: 'Seed permissions with default data' })
  // @ApiResponse({ status: 201, description: 'Permissions seeded successfully', type: [PermissionEntity] })
  // async seed() {
  //   const data = await this.permissionsService.seed();
  //   return { success: true, message: `${data.length} permissions seeded successfully`, data };
  // }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieve all permissions' })
  @ApiResponse({
    status: 200,
    description: 'Permissions retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Permissions retrieved successfully' },
        data: { type: 'array', items: { type: 'object' } }
      }
    }
  })
  async findAll() {
    const data = await this.permissionsService.findAll();
    return { success: true, message: 'Permissions retrieved successfully', data };
  }

  @Get('module/:module')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieve permissions by module' })
  @ApiParam({ name: 'module', description: 'Module name', example: 'users' })
  @ApiResponse({
    status: 200,
    description: 'Permissions retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Permissions for module "users" retrieved' },
        data: { type: 'array', items: { type: 'object' } }
      }
    }
  })
  async findByModule(@Param('module') module: string) {
    const data = await this.permissionsService.findByModule(module);
    return { success: true, message: `Permissions for module "${module}" retrieved`, data };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieve a permission by ID' })
  @ApiParam({ name: 'id', description: 'Permission ID' })
  @ApiResponse({
    status: 200,
    description: 'Permission retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Permission retrieved successfully' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async findOne(@Param('id') id: string) {
    const data = await this.permissionsService.findOne(id);
    return { success: true, message: 'Permission retrieved successfully', data };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a permission' })
  @ApiParam({ name: 'id', description: 'Permission ID' })
  @ApiBody({ type: UpdatePermissionDto })
  @ApiResponse({
    status: 200,
    description: 'Permission updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Permission updated successfully' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async update(@Param('id') id: string, @Body() dto: UpdatePermissionDto) {
    const data = await this.permissionsService.update(id, dto);
    return { success: true, message: 'Permission updated successfully', data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a permission' })
  @ApiParam({ name: 'id', description: 'Permission ID' })
  @ApiResponse({
    status: 200,
    description: 'Permission deactivated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Permission deactivated successfully' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async remove(@Param('id') id: string) {
    const data = await this.permissionsService.remove(id);
    return { success: true, message: 'Permission deactivated successfully', data };
  }
}