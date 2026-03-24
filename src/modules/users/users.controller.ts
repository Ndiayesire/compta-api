// src/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
// import { ChangePasswordDto } from './dto/change-password.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsArray, IsString } from 'class-validator';

class RoleIdsDto {
  @IsArray()
  @IsString({ each: true })
  roleIds: string[];
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUserDto) {
    const data = await this.usersService.create(dto);
    return { success: true, message: 'User created successfully', data };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@CurrentUser() user: any) {
    const data = await this.usersService.findAll(user.companyId);
    return { success: true, message: 'Users retrieved successfully', data };
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMe(@CurrentUser() user: any) {
    const data = await this.usersService.findOne(user.id);
    return { success: true, message: 'Current user retrieved successfully', data };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    const data = await this.usersService.findOne(id);
    return { success: true, message: 'User retrieved successfully', data };
  }

//   @Patch('me/change-password')
//   @HttpCode(HttpStatus.OK)
//   async changePassword(
//     @CurrentUser() user: any,
//     @Body() dto: ChangePasswordDto,
//   ) {
//     const data = await this.usersService.changePassword(user.id, dto);
//     return { success: true, message: data.message, data: null };
//   }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const data = await this.usersService.update(id, dto);
    return { success: true, message: 'User updated successfully', data };
  }


  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    const data = await this.usersService.remove(id);
    return { success: true, message: 'User deactivated successfully', data };
  }
}