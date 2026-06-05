import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt/jwt-auth.guard';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleEntity } from './entities/role.entity';
import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class PermissionIdsDto {
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    type: [String],
    description: 'Array of permission IDs to add/remove/sync',
    example: ['permission-uuid-1', 'permission-uuid-2', 'permission-uuid-3']
  })
  permissionIds: string[];
}

@ApiTags('roles')
@ApiBearerAuth('JWT')
@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new role' })
  @ApiBody({ type: CreateRoleDto })
  @ApiResponse({
    status: 201,
    description: 'Role created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Role created successfully' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() dto: CreateRoleDto) {
    const data = await this.rolesService.create(dto);
    return { success: true, message: 'Role created successfully', data };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieve all roles' })
  @ApiResponse({
    status: 200,
    description: 'Roles retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Roles retrieved successfully' },
        data: { type: 'array', items: { type: 'object' } }
      }
    }
  })
  async findAll() {
    const data = await this.rolesService.findAll();
    return { success: true, message: 'Roles retrieved successfully', data };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieve a role by ID' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({
    status: 200,
    description: 'Role retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Role retrieved successfully' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async findOne(@Param('id') id: string) {
    const data = await this.rolesService.findOne(id);
    return { success: true, message: 'Role retrieved successfully', data };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a role' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiBody({ type: UpdateRoleDto })
  @ApiResponse({
    status: 200,
    description: 'Role updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Role updated successfully' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    const data = await this.rolesService.update(id, dto);
    return { success: true, message: 'Role updated successfully', data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a role' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({
    status: 200,
    description: 'Role deactivated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Role deactivated successfully' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async remove(@Param('id') id: string) {
    const data = await this.rolesService.remove(id);
    return { success: true, message: 'Role deactivated successfully', data };
  }

  @Post(':id/permissions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add permissions to a role' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiBody({ type: PermissionIdsDto })
  @ApiResponse({
    status: 200,
    description: 'Permissions added to role successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Permissions added to role successfully' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async addPermissions(
    @Param('id') id: string,
    @Body() body: PermissionIdsDto,
  ) {
    const data = await this.rolesService.addPermissions(id, body.permissionIds);
    return { success: true, message: 'Permissions added to role successfully', data };
  }

  @Delete(':id/permissions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove permissions from a role' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiBody({ type: PermissionIdsDto })
  @ApiResponse({
    status: 200,
    description: 'Permissions removed from role successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Permissions removed from role successfully' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async removePermissions(
    @Param('id') id: string,
    @Body() body: PermissionIdsDto,
  ) {
    const data = await this.rolesService.removePermissions(id, body.permissionIds);
    return { success: true, message: 'Permissions removed from role successfully', data };
  }

  // Remplacer toutes les permissions (sync)
  @Patch(':id/permissions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync/replace all permissions for a role' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiBody({ type: PermissionIdsDto })
  @ApiResponse({
    status: 200,
    description: 'Permissions synced successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Permissions synced successfully' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async syncPermissions(
    @Param('id') id: string,
    @Body() body: PermissionIdsDto,
  ) {
    const data = await this.rolesService.syncPermissions(id, body.permissionIds);
    return { success: true, message: 'Permissions synced successfully', data };
  }
}
