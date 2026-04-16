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
import { TiersService } from './tiers.service';
import { CreateTierDto } from './dto/create-tier.dto';
import { UpdateTierDto } from './dto/update-tier.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';

@ApiTags('tiers')
@ApiBearerAuth('JWT')
@Controller('tiers')
export class TiersController {
  constructor(private readonly tiersService: TiersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Create a tier for a client of your company',
    description:
      'Links a `tiers` row to `client_id` and `tier_type_id`.',
  })
  @ApiResponse({ status: 201, description: 'Tier created' })
  @ApiResponse({ status: 400, description: 'Invalid client or tier type' })
  async create(@Body() dto: CreateTierDto, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const data = await this.tiersService.create(dto, companyId);
    return {
      success: true,
      message: 'Tier created successfully',
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all tiers for your company' })
  async findAll(@CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const data = await this.tiersService.findAll(companyId);
    return {
      success: true,
      message: 'Tiers retrieved successfully',
      data,
    };
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'List tiers for a client' })
  @ApiParam({ name: 'clientId', type: String })
  async findByClient(
    @Param('clientId') clientId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const data = await this.tiersService.findByClient(clientId, companyId);
    return {
      success: true,
      message: 'Tiers retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tier by ID' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const data = await this.tiersService.findOne(id, companyId);
    return {
      success: true,
      message: 'Tier retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Update tier' })
  @ApiParam({ name: 'id', type: String })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTierDto,
    @CurrentUser() user: AuthUser,
  ) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const data = await this.tiersService.update(id, dto, companyId);
    return {
      success: true,
      message: 'Tier updated successfully',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete tier' })
  @ApiParam({ name: 'id', type: String })
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const data = await this.tiersService.remove(id, companyId);
    return {
      success: true,
      message: 'Tier deleted successfully',
      data,
    };
  }
}
