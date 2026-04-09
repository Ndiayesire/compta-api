import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsArray, IsString } from 'class-validator';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

class RoleIdDto {
  @IsString()
  roleId: string;
}

@ApiTags('users')
@ApiBearerAuth('JWT')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({
    type: CreateUserDto,
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
        password: { type: 'string', minLength: 6, example: 'password123' },
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
        phone: { type: 'string', example: '+221770000000' },
        address: { type: 'string', example: 'Address' },
        avatar: { type: 'string', example: 'avatar.png' },
        companyId: { type: 'string', example: 'company-uuid-123' }
      },
      required: ['email', 'password']
    }
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'User created successfully' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() dto: CreateUserDto) {
    const data = await this.usersService.create(dto);
    return { success: true, message: 'User created successfully', data };
  }


  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Users retrieved successfully' },
        data: { type: 'array', items: { type: 'object' } }
      }
    }
  })
  async findAll(@CurrentUser() user: any) {
    const data = await this.usersService.findAll(user.companyId);
    return { success: true, message: 'Users retrieved successfully', data };
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({
    status: 200,
    description: 'Current user retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Current user retrieved successfully'},
        data: { type: 'object' }
      }
    }
  })
  async getMe(@CurrentUser() user: any) {
    const data = await this.usersService.findOne(user.id);
    return { success: true, message: 'Current user retrieved successfully', data };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', description: 'User ID', example: 'user-uuid-123' })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'User retrieved successfully' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string) {
    const data = await this.usersService.findOne(id);
    return { success: true, message: 'User retrieved successfully', data };
  }

  @Patch('me/change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change current user password' })
  @ApiBody({
    type: ChangePasswordDto,
    schema: {
      type: 'object',
      properties: {
        currentPassword: { type: 'string', minLength: 6, example: 'currentPassword123' },
        newPassword: { type: 'string', minLength: 6, example: 'newPassword123' },
        confirmPassword: { type: 'string', minLength: 6, example: 'newPassword123' }
      },
      required: ['currentPassword', 'newPassword', 'confirmPassword']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Password changed successfully' },
        data: { type: 'null' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid password data' })
  async changePassword(
    @CurrentUser() user: any,
    @Body() dto: ChangePasswordDto,
  ) {
    const data = await this.usersService.changePassword(user.id, dto);
    return { success: true, message: data.message, data: null };
  }


  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', description: 'User ID', example: 'user-uuid-123' })
  @ApiBody({
    type: UpdateUserDto,
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
        password: { type: 'string', minLength: 6, example: 'password123' },
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
        phone: { type: 'string', example: '+221770000000' },
        address: { type: 'string', example: 'Address' },
        avatar: { type: 'string', example: 'avatar.png' },
        companyId: { type: 'string', example: 'company-uuid-123' }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'User updated successfully' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const data = await this.usersService.update(id, dto);
    return { success: true, message: 'User updated successfully', data };
  }


  @Patch(':id/role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set role for a user' })
  @ApiParam({ name: 'id', description: 'User ID', example: 'user-uuid-123' })
  @ApiBody({
    type: RoleIdDto,
    schema: {
      type: 'object',
      properties: {
        roleId: {
          type: 'string',
          example: 'role-uuid-1'
        }
      },
      required: ['roleId']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Role set for user successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Role set for user successfully' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async setRole(@Param('id') id: string, @Body() dto: RoleIdDto) {
    const data = await this.usersService.setRole(id, dto.roleId);
    return { success: true, message: 'Role set for user successfully', data };
  }


  @Delete(':id/role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unset role from a user' })
  @ApiParam({ name: 'id', description: 'User ID', example: 'user-uuid-123' })
  @ApiResponse({
    status: 200,
    description: 'Role unset from user successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Role unset from user successfully' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async unsetRole(@Param('id') id: string) {
    const data = await this.usersService.unsetRole(id);
    return { success: true, message: 'Role unset from user successfully', data };
  }



  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a user' })
  @ApiParam({ name: 'id', description: 'User ID', example: 'user-uuid-123' })
  @ApiResponse({
    status: 200,
    description: 'User deactivated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'User deactivated successfully' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id') id: string) {
    const data = await this.usersService.remove(id);
    return { success: true, message: 'User deactivated successfully', data };
  }
}