import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsUUID,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'client-uuid-123' })
  @IsUUID()
  clientId: string;

  @ApiPropertyOptional({
    description: 'Identification document type (settings_identification_type)',
    example: 'identification-type-uuid-123',
  })
  @IsOptional()
  @IsUUID()
  identificationTypeId?: string;

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

  @ApiPropertyOptional({
    description: 'Numero Assure Sociale',
    example: '1 85 08 75 123 456 78',
  })
  @IsOptional()
  @IsString()
  socialInsuranceNumber?: string;

  @ApiPropertyOptional({
    description: "Numero d'identite (texte libre)",
    example: 'AB1234567',
  })
  @IsOptional()
  @IsString()
  identityNumber?: string;

  @ApiPropertyOptional({
    description: 'Salaire (contrat en cours — employee_contract_types)',
    example: 450000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salary?: number;

  @ApiPropertyOptional({
    description: 'Statut manager sur le contrat',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isManager?: boolean;

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
