import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEmail, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateCompanyUserDto } from './create-company-user.dto';

export class CreateCompanyDto {
  @ApiProperty({ description: 'Company name', example: 'Sonatel SA' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Contact email', example: 'contact@sonatel.sn' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Phone number', example: '+221338690000' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: 'Street address', example: 'Avenue Cheikh Anta Diop' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ description: 'NINEA', example: 'SN123456789' })
  @IsString()
  @IsNotEmpty()
  ninea: string;

  @ApiPropertyOptional({ description: 'Use TVA for this company', example: true })
  @IsBoolean()
  @IsOptional()
  useTva?: boolean;

  @ApiProperty({ description: 'Internal reference', example: '6201Z' })
  @IsString()
  @IsNotEmpty()
  reference: string;

  @ApiProperty({ description: 'Legal form ID (settings)', example: 'legal-form-uuid-123' })
  @IsString()
  @IsNotEmpty()
  legalFormId: string;

  @ApiProperty({ description: 'Country ID (settings)', example: 'country-uuid-123' })
  @IsString()
  @IsNotEmpty()
  countryId: string;

  @ApiProperty({ description: 'Region ID (settings)', example: 'region-uuid-456' })
  @IsString()
  @IsNotEmpty()
  regionId: string;

  @ApiPropertyOptional({ description: 'Arbitrary JSON metadata', example: {} })
  @IsObject()
  @IsOptional()
  meta?: Record<string, unknown>;

  @ApiProperty({
    description: 'Owner user created with the company',
    type: CreateCompanyUserDto,
  })
  @ValidateNested()
  @Type(() => CreateCompanyUserDto)
  user: CreateCompanyUserDto;
}
