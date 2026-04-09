import {
  IsString, IsOptional, IsNotEmpty, IsEnum, IsBoolean, IsEmail, IsUrl, IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompanyStatus } from '@prisma/client';
import { CreateCompanyUserDto } from './create-company-user.dto';

export class CreateCompanyDto {
  // Identité légale
  @ApiProperty({ description: 'Company name', example: 'Sonatel SA' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'NINEA', example: 'SN123456789' })
  @IsString()
  @IsOptional()
  ninea?: string;

  @ApiPropertyOptional({ description: 'TVA', example: 'SN12345678901' })
  @IsString()
  @IsOptional()
  tva?: string;

  @ApiPropertyOptional({ description: 'Legal form ID', example: 'legal-form-uuid-123' })
  @IsString()
  @IsOptional()
  legalFormId?: string;

  @ApiPropertyOptional({ description: 'Company status', enum: CompanyStatus, example: CompanyStatus.ACTIVE })
  @IsEnum(CompanyStatus)
  @IsOptional()
  status?: CompanyStatus;

  @ApiPropertyOptional({ description: 'Reference', example: '6201Z' })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiPropertyOptional({ description: 'Street address', example: 'Avenue Cheikh Anta Diop' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'Country ID', example: 'country-uuid-123' })
  @IsString()
  @IsOptional()
  countryId?: string;

  @ApiPropertyOptional({ description: 'Region ID', example: 'region-uuid-456' })
  @IsString()
  @IsOptional()
  regionId?: string;

  // Contact
  @ApiPropertyOptional({ description: 'Contact email', example: 'contact@sonatel.sn' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+221338690000' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Company website', example: 'https://www.sonatel.sn' })
  @IsUrl()
  @IsOptional()
  website?: string;

  // Fiscal
  @ApiPropertyOptional({ description: 'Currency ID', example: 'currency-uuid-123' })
  @IsString()
  @IsOptional()
  currencyId?: string;

  @ApiPropertyOptional({ description: 'Is this a holding company?', example: false })
  @IsBoolean()
  @IsOptional()
  isHolding?: boolean;

  // Méthodes de paiement
  @ApiPropertyOptional({ description: 'Payment method IDs', type: [String], example: ['payment-method-uuid-1'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  paymentMethodIds?: string[];

  @ApiProperty({
    description: 'Initial user for this company; receives companyId of the new company',
    type: CreateCompanyUserDto,
  })
  @ValidateNested()
  @Type(() => CreateCompanyUserDto)
  user: CreateCompanyUserDto;
}