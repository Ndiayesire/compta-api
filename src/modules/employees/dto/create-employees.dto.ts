import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsDateString, IsBoolean, IsUUID } from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'client-uuid-123' })
  @IsUUID()
  clientId: string;

  @ApiProperty({ example: 'contract-type-uuid-123' })
  @IsUUID()
  contractTypeId: string;

  @ApiProperty({ example: 'Mamadou' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Ndiaye' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'Stagiaire Marketing Digital' })
  @IsString()
  jobTitle: string;

  @ApiPropertyOptional({ example: 'Marketing' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({ example: 'mamadou.ndiaye@entreprise.sn' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+221771234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: '2024-01-15T00:00:00.000Z' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: '2024-07-15T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}