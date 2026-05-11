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
import { EmployeeContractsService } from './employee-contracts.service';
import { CreateEmployeeContractDto } from './dto/create-employee-contract.dto';
import { UpdateEmployeeContractDto } from './dto/update-employee-contract.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';

@ApiTags('employee-contracts')
@ApiBearerAuth('JWT')
@Controller('employee-contracts')
export class EmployeeContractsController {
  constructor(
    private readonly employeeContractsService: EmployeeContractsService,
  ) {}

  private companyIdOrThrow(user: AuthUser) {
    const companyId = user.companyId;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return companyId;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Create an employee contract row (employee_contract_types)',
    description:
      "Si `isActive=true`, ce contrat devient l'unique contrat actif de l'employé et les autres contrats actifs passent automatiquement à `isActive=false`.",
  })
  @ApiResponse({ status: 201, description: 'Created' })
  async create(
    @Body() dto: CreateEmployeeContractDto,
    @CurrentUser() user: AuthUser,
  ) {
    const companyId = this.companyIdOrThrow(user);
    const data = await this.employeeContractsService.create(dto, companyId);
    return {
      success: true,
      message: 'Employee contract created successfully',
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List employee contracts for your company' })
  async findAll(@CurrentUser() user: AuthUser) {
    const companyId = this.companyIdOrThrow(user);
    const data = await this.employeeContractsService.findAll(companyId);
    return {
      success: true,
      message: 'Employee contracts retrieved successfully',
      data,
    };
  }

  @Get('employee/:employeeId')
  @ApiOperation({ summary: 'List contracts for an employee' })
  @ApiParam({ name: 'employeeId', type: String })
  async findByEmployee(
    @Param('employeeId') employeeId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const companyId = this.companyIdOrThrow(user);
    const data = await this.employeeContractsService.findByEmployee(
      employeeId,
      companyId,
    );
    return {
      success: true,
      message: 'Employee contracts retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee contract by ID' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const companyId = this.companyIdOrThrow(user);
    const data = await this.employeeContractsService.findOne(id, companyId);
    return {
      success: true,
      message: 'Employee contract retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Update employee contract' })
  @ApiResponse({
    status: 200,
    description:
      "Contrat mis à jour. Si `isActive=true`, les autres contrats actifs du même employé sont désactivés automatiquement.",
  })
  @ApiParam({ name: 'id', type: String })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeContractDto,
    @CurrentUser() user: AuthUser,
  ) {
    const companyId = this.companyIdOrThrow(user);
    const data = await this.employeeContractsService.update(
      id,
      dto,
      companyId,
    );
    return {
      success: true,
      message: 'Employee contract updated successfully',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete employee contract' })
  @ApiParam({ name: 'id', type: String })
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const companyId = this.companyIdOrThrow(user);
    const data = await this.employeeContractsService.remove(id, companyId);
    return {
      success: true,
      message: 'Employee contract deleted successfully',
      data,
    };
  }
}
