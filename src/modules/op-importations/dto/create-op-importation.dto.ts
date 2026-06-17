import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateOpImportationDto {
  @ApiProperty({
    description: 'UUID du fournisseur (tiers, type SUPPLIER recommandé)',
    example: 'a0000032-0000-4000-8000-000000000001',
  })
  @IsUUID()
  tierId: string;

  @ApiProperty({
    description: 'UUID du pays (`settings_countries`)',
    example: 'a0000002-0000-4000-8000-000000000001',
  })
  @IsUUID()
  countryId: string;

  @ApiProperty({
    description: 'UUID du type de déduction (`deduction_types`)',
    example: 'a0000039-0000-4000-8000-000000000001',
  })
  @IsUUID()
  deductionTypeId: string;

  @ApiProperty({
    description: 'UUID de la nature de bien ou service (`property_nature_types`)',
    example: 'a000003a-0000-4000-8000-000000000001',
  })
  @IsUUID()
  propertyNatureTypeId: string;

  @ApiProperty({
    description: 'Numéro de déclaration / référence unique métier',
    example: 'IMP-SEED-2025-01',
  })
  @IsString()
  @MaxLength(255)
  code: string;

  @ApiProperty({ description: 'Mois de déclaration (1–12)', example: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  month: number;

  @ApiProperty({ description: 'Année de déclaration', example: 2025 })
  @Type(() => Number)
  @IsInt()
  year: number;

  @ApiProperty({
    description: 'Date de l’opération (ISO 8601)',
    example: '2025-01-10T00:00:00.000Z',
  })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ description: 'Montant HT', example: 200000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  net?: number;

  @ApiPropertyOptional({ description: 'Montant TVA', example: 36000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  tax?: number;

  @ApiPropertyOptional({ description: 'TVA déductible', example: 20000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxDeduction?: number;

  @ApiPropertyOptional({
    description: 'Total TTC (souvent net + tax − taxDeduction)',
    example: 216000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  total?: number;

  @ApiPropertyOptional({ description: 'Coefficient de prorata (0–1 ou 1 = 100 %)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  prorata?: number;
}
