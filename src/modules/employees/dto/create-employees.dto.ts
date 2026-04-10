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

  @ApiProperty({ example: 'mamadou.ndiaye@entreprise.sn' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+221771234567' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'Dakar, Plateau' })
  @IsString()
  address: string;

  @ApiProperty({ example: '2024-01-15T00:00:00.000Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-07-15T00:00:00.000Z' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
