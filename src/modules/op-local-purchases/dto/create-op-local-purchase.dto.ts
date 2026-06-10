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

  @ApiProperty({ example: 500000 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  net: number;

  @ApiProperty({ example: 90000 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  tax: number;

  @ApiProperty({ example: 50000 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxDeduction: number;

  @ApiProperty({ example: 590000 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  total: number;

  @ApiProperty({ example: {} })
  @IsObject()
  prorata: Record<string, unknown>;
}
