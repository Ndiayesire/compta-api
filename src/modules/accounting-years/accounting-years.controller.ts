import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AccountingYearsService } from './accounting-years.service';
import { CreateAccountingYearDto } from './dto/create-accounting-year.dto';
import { UpdateAccountingYearDto } from './dto/update-accounting-year.dto';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('accounting-years')
@ApiBearerAuth('JWT')
@Controller('accounting-years')
export class AccountingYearsController {
  constructor(private readonly accountingYearsService: AccountingYearsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Create accounting year' })
  async create(@Body() dto: CreateAccountingYearDto) {
    const data = await this.accountingYearsService.create(dto);
    return {
      success: true,
      message: 'Accounting year created successfully',
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List accounting years (non-deleted)' })
  async findAll() {
    const data = await this.accountingYearsService.findAll();
    return {
      success: true,
      message: 'Accounting years retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get accounting year by ID' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string) {
    const data = await this.accountingYearsService.findOne(id);
    return {
      success: true,
      message: 'Accounting year retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Update accounting year' })
  @ApiParam({ name: 'id', type: String })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAccountingYearDto,
  ) {
    const data = await this.accountingYearsService.update(id, dto);
    return {
      success: true,
      message: 'Accounting year updated successfully',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete accounting year' })
  @ApiParam({ name: 'id', type: String })
  async remove(@Param('id') id: string) {
    const data = await this.accountingYearsService.remove(id);
    return {
      success: true,
      message: 'Accounting year deleted successfully',
      data,
    };
  }
}
