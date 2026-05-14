import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsUUID, IsDateString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEmployeeContractDto {
  @ApiProperty({ description: 'Employee ID' })
  @IsUUID()
  employeeId: string;

  @ApiProperty({ description: 'Contract type ID (settings)' })
  @IsUUID()
  contractTypeId: string;

  @ApiProperty({ example: '2024-01-15T00:00:00.000Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2025-12-31T23:59:59.000Z' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: 'Comptable' })
  @IsString()
  jobTitle: string;

  @ApiPropertyOptional({ description: 'Salaire lié au contrat', example: 450000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salary?: number;

  @ApiPropertyOptional({ description: 'Poste de management', example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isManager?: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
