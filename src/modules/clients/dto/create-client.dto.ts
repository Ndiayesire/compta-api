import { IsString, IsOptional, IsBoolean, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({ description: 'Client name', example: 'Aliou Ndiaye' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Client email', example: 'aliou.ndiaye@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Client phone', example: '+221 77 123 45 67' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Client address', example: 'Dakar, Senegal' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ description: 'Client Type ID', example: 'clienttype-uuid-123' })
  @IsString()
  clientTypeId: string;

  @ApiPropertyOptional({ description: 'Flag Client ID', example: 'flagclient-uuid-123' })
  @IsString()
  @IsOptional()
  clientFlagId?: string;

  @ApiPropertyOptional({ description: 'Country ID', example: 'country-uuid-123' })
  @IsString()
  @IsOptional()
  countryId?: string;

  @ApiPropertyOptional({ description: 'Region ID', example: 'region-uuid-123' })
  @IsString()
  @IsOptional()
  regionId?: string;

  @ApiPropertyOptional({ description: 'Currency ID', example: 'currency-uuid-123' })
  @IsString()
  @IsOptional()
  currencyId?: string;

  @ApiPropertyOptional({ description: 'Legal Form ID', example: 'legalform-uuid-123' })
  @IsString()
  @IsOptional()
  legalFormId?: string;

  @ApiPropertyOptional({ description: 'SIRET number', example: '123 456 789 00010' })
  @IsString()
  @IsOptional()
  siret?: string;

  @ApiPropertyOptional({ description: 'VAT number', example: 'SN123456789' })
  @IsString()
  @IsOptional()
  vatNumber?: string;

  @ApiPropertyOptional({ description: 'NAF code', example: '6201Z' })
  @IsString()
  @IsOptional()
  nafCode?: string;

  @ApiPropertyOptional({ description: 'Is active', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}