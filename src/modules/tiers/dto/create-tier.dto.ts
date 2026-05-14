import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class CreateTierDto {
  @ApiProperty({ description: 'Tier type ID (settings)', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  tierTypeId: string;

  @ApiProperty({ description: 'Client ID (must belong to your company)' })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({ example: 'Fournisseur principal' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'SN123456789' })
  @IsString()
  ninea: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  useTva?: boolean;

  @ApiProperty({ example: 'TIER-REF-001' })
  @IsString()
  reference: string;

  @ApiPropertyOptional({
    example: { beneficiaryAddress: 'VDN, Dakar' },
    description:
      'Métadonnées libres (objet JSON). Ex. **beneficiaryAddress** : adresse du bénéficiaire pour les impressions / formulaires (ex. états DGID Sénégal).',
  })
  @IsObject()
  @IsOptional()
  meta?: Record<string, unknown>;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
