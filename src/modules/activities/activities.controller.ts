import {
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
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';

@ApiTags('activities')
@ApiBearerAuth('JWT')
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Create activity for current user',
    description: '`user_id` is set from the JWT (activities table).',
  })
  async create(
    @Body() dto: CreateActivityDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.activitiesService.create(dto, user.id);
    return {
      success: true,
      message: 'Activity created successfully',
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List activities for current user' })
  async findAll(@CurrentUser() user: AuthUser) {
    const data = await this.activitiesService.findAll(user.id);
    return {
      success: true,
      message: 'Activities retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get activity by ID' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const data = await this.activitiesService.findOne(id, user.id);
    return {
      success: true,
      message: 'Activity retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Update activity' })
  @ApiParam({ name: 'id', type: String })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateActivityDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.activitiesService.update(id, dto, user.id);
    return {
      success: true,
      message: 'Activity updated successfully',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete activity' })
  @ApiParam({ name: 'id', type: String })
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const data = await this.activitiesService.remove(id, user.id);
    return {
      success: true,
      message: 'Activity deleted successfully',
      data,
    };
  }
}
