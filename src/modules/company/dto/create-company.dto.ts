import {
  IsString, IsOptional, IsNotEmpty, IsEnum, IsBoolean, IsEmail, IsUrl, IsDateString,} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompanyStatus, LegalForm } from '@prisma/client';

export class CreateCompanyDto {
  // Identité légale
  @ApiProperty({
    description: 'Company name',
    example: 'Sonatel SA'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'SIRET number',
    example: 'SN123456789'
  })
  @IsString()
  @IsOptional()
  siret?: string;

  @ApiPropertyOptional({
    description: 'VAT number',
    example: 'SN12345678901'
  })
  @IsString()
  @IsOptional()
  vatNumber?: string;

  @ApiPropertyOptional({
    description: 'Legal form',
    enum: LegalForm,
    example: LegalForm.SARL
  })
  @IsEnum(LegalForm)
  @IsOptional()
  legalForm?: LegalForm;

  @ApiPropertyOptional({
    description: 'Company status',
    enum: CompanyStatus,
    example: CompanyStatus.ACTIVE
  })
  @IsEnum(CompanyStatus)
  @IsOptional()
  status?: CompanyStatus;

  @ApiPropertyOptional({
    description: 'NAF code',
    example: '6201Z'
  })
  @IsString()
  @IsOptional()
  nafCode?: string;

  // Adresse
  @ApiPropertyOptional({
    description: 'Street address',
    example: 'Avenue Cheikh Anta Diop'
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: 'Address line 2',
    example: 'Suite 456'
  })
  @IsString()
  @IsOptional()
  addressLine2?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Dakar'
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    description: 'State/Province',
    example: 'Dakar Region'
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({
    description: 'Country ID',
    example: 'country-uuid-123'
  })
  @IsString()
  @IsOptional()
  countryId?: string;

  @ApiPropertyOptional({
    description: 'Region ID',
    example: 'region-uuid-456'
  })
  @IsString()
  @IsOptional()
  regionId?: string;

  // Contact
  @ApiPropertyOptional({
    description: 'Contact email',
    example: 'contact@sonatel.sn'
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+221338690000'
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Company website',
    example: 'https://www.sonatel.sn'
  })
  @IsUrl()
  @IsOptional()
  website?: string;

  // Fiscal
  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'XOF'
  })
  @IsString()
  @IsOptional()
  currencyCode?: string;

  @ApiPropertyOptional({
    description: 'Fiscal year start date',
    example: '2024-01-01'
  })
  @IsDateString()
  @IsOptional()
  fiscalYearStart?: string;

  @ApiPropertyOptional({
    description: 'Fiscal year end date',
    example: '2024-12-31'
  })
  @IsDateString()
  @IsOptional()
  fiscalYearEnd?: string;

  @ApiPropertyOptional({
    description: 'Is this a holding company?',
    example: false
  })
  @IsBoolean()
  @IsOptional()
  isHolding?: boolean;

  // Méthodes de paiement
  @ApiPropertyOptional({
    description: 'Payment method IDs',
    type: [String],
    example: ['payment-method-uuid-1', 'payment-method-uuid-2']
  })
  @IsString({ each: true })
  @IsOptional()
  paymentMethodIds?: string[];
}