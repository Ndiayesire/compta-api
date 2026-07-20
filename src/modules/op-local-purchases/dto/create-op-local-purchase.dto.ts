import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsObject, IsUUID, Min } from 'class-validator';

export class CreateOpLocalPurchaseDto {
  @ApiProperty()
  @IsUUID()
  tierId: string;

  @ApiProperty()
  @IsUUID()
  deductionTypeId: string;

  @ApiProperty()
  @IsUUID()
  propertyNatureTypeId: string;

  @ApiProperty({ example: 1, description: 'Mois (1–12)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  month: number;

  @ApiProperty({ example: 2025, description: 'Année' })
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  year: number;

  @ApiProperty({ example: 500000, description: 'Montant HT (peut être négatif)' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  net: number;

  @ApiProperty({ example: 90000, description: 'TVA (peut être négative)' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  tax: number;

  @ApiProperty({ example: 50000, description: 'TVA déductible (peut être négative)' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  taxDeduction: number;

  @ApiProperty({ example: 590000, description: 'TTC (peut être négatif)' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  total: number;

  @ApiProperty({ example: {} })
  @IsObject()
  prorata: Record<string, unknown>;
}
