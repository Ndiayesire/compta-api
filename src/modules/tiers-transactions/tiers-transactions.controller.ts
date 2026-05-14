import { BadRequestException, Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { TiersTransactionsService } from './tiers-transactions.service';
import { CreateTiersTransactionDto } from './dto/create-tiers-transaction.dto';
import { UpdateTiersTransactionDto } from './dto/update-tiers-transaction.dto';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';

@ApiTags('tiers-transactions')
@ApiBearerAuth('JWT')
@Controller('tiers-transactions')
export class TiersTransactionsController {
  constructor(
    private readonly tiersTransactionsService: TiersTransactionsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary:
      'Create a tier transaction line (tier must belong to your company)',
  })
  async create(
    @Body() dto: CreateTiersTransactionDto,
    @CurrentUser() user: AuthUser,
  ) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const data = await this.tiersTransactionsService.create(dto, companyId);
    return {
      success: true,
      message: 'Tiers transaction created successfully',
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List tier transactions for your company' })
  @ApiQuery({
    name: 'tierId',
    required: false,
    description: 'Filter by tier ID',
  })
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query('tierId') tierId?: string,
  ) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const data = await this.tiersTransactionsService.findAll(
      companyId,
      tierId,
    );
    return {
      success: true,
      message: 'Tiers transactions retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tier transaction by ID' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const data = await this.tiersTransactionsService.findOne(id, companyId);
    return {
      success: true,
      message: 'Tiers transaction retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Update tier transaction' })
  @ApiParam({ name: 'id', type: String })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTiersTransactionDto,
    @CurrentUser() user: AuthUser,
  ) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const data = await this.tiersTransactionsService.update(
      id,
      dto,
      companyId,
    );
    return {
      success: true,
      message: 'Tiers transaction updated successfully',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete tier transaction' })
  @ApiParam({ name: 'id', type: String })
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    const data = await this.tiersTransactionsService.remove(id, companyId);
    return {
      success: true,
      message: 'Tiers transaction deleted successfully',
      data,
    };
  }
}
