import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AccountingQuartersService } from './accounting-quarters.service';
import { CreateAccountingQuarterDto } from './dto/create-accounting-quarter.dto';
import { UpdateAccountingQuarterDto } from './dto/update-accounting-quarter.dto';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('accounting-quarters')
@ApiBearerAuth('JWT')
@Controller('accounting-quarters')
export class AccountingQuartersController {
  constructor(
    private readonly accountingQuartersService: AccountingQuartersService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Create accounting quarter' })
  async create(@Body() dto: CreateAccountingQuarterDto) {
    const data = await this.accountingQuartersService.create(dto);
    return {
      success: true,
      message: 'Accounting quarter created successfully',
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List accounting quarters (optional filter by year)' })
  @ApiQuery({
    name: 'accountingYearId',
    required: false,
    description: 'Filter by accounting year ID',
  })
  async findAll(@Query('accountingYearId') accountingYearId?: string) {
    const data = await this.accountingQuartersService.findAll(accountingYearId);
    return {
      success: true,
      message: 'Accounting quarters retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get accounting quarter by ID' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string) {
    const data = await this.accountingQuartersService.findOne(id);
    return {
      success: true,
      message: 'Accounting quarter retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Update accounting quarter' })
  @ApiParam({ name: 'id', type: String })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAccountingQuarterDto,
  ) {
    const data = await this.accountingQuartersService.update(id, dto);
    return {
      success: true,
      message: 'Accounting quarter updated successfully',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete accounting quarter' })
  @ApiParam({ name: 'id', type: String })
  async remove(@Param('id') id: string) {
    const data = await this.accountingQuartersService.remove(id);
    return {
      success: true,
      message: 'Accounting quarter deleted successfully',
      data,
    };
  }
}
