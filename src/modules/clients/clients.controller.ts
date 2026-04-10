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
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('clients')
@ApiBearerAuth('JWT')
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Create a new client for the current company',
    description:
      'If `user` is omitted, `client.user_id` is the authenticated user. If `user` is provided, that user is created and linked as the client contact (same pattern as company registration).',
  })
  @ApiBody({ type: CreateClientDto })
  @ApiResponse({ status: 201, description: 'Client created successfully' })
  @ApiResponse({ status: 409, description: 'Nested user email already exists' })
  async create(
    @Body() dto: CreateClientDto,
    @CurrentUser() user: any,
  ) {
    const data = await this.clientsService.create(dto, user.companyId, user.id);
    return { success: true, message: 'Client created successfully', data };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all clients for current company' })
  async findAll(@CurrentUser() user: any,) {
    const data = await this.clientsService.findAll(user.companyId);
    return { success: true, message: 'Clients retrieved successfully', data };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a client by ID' })
  @ApiParam({ name: 'id', description: 'Client ID', example: 'client-uuid-123' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any,) {
    const data = await this.clientsService.findOne(id, user.companyId);
    return { success: true, message: 'Client retrieved successfully', data };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Update a client (companyId not modifiable)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
    @CurrentUser() user: any,
  ) {
    const data = await this.clientsService.update(id, dto, user.companyId);
    return { success: true, message: 'Client updated successfully', data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a client (soft delete)' })
  async remove(@Param('id') id: string, @CurrentUser() user: any,) {
    const data = await this.clientsService.remove(id, user.companyId);
    return { success: true, message: 'Client deactivated successfully', data };
  }
}