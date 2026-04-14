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
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('notifications')
@ApiBearerAuth('JWT')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Create notification for current user',
    description:
      '`user_id` is set from the JWT. Server-side jobs would typically target another user via an internal service.',
  })
  async create(
    @Body() dto: CreateNotificationDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.notificationsService.create(dto, user.id);
    return {
      success: true,
      message: 'Notification created successfully',
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List notifications for current user' })
  async findAll(@CurrentUser() user: AuthUser) {
    const data = await this.notificationsService.findAll(user.id);
    return {
      success: true,
      message: 'Notifications retrieved successfully',
      data,
    };
  }

  @Get('unread')
  @ApiOperation({ summary: 'List unread notifications' })
  async findUnread(@CurrentUser() user: AuthUser) {
    const data = await this.notificationsService.findUnread(user.id);
    return {
      success: true,
      message: 'Unread notifications retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const data = await this.notificationsService.findOne(id, user.id);
    return {
      success: true,
      message: 'Notification retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Update notification (e.g. mark read with isRead: true)',
  })
  @ApiParam({ name: 'id', type: String })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateNotificationDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.notificationsService.update(id, dto, user.id);
    return {
      success: true,
      message: 'Notification updated successfully',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete notification' })
  @ApiParam({ name: 'id', type: String })
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const data = await this.notificationsService.remove(id, user.id);
    return {
      success: true,
      message: 'Notification deleted successfully',
      data,
    };
  }
}
