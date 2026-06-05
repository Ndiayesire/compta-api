import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsObject, IsUUID, Min } from 'class-validator';

export class CreateOpLocalPurchaseDto {
  @ApiProperty()
  @IsUUID()
  providerId: string;

  @ApiProperty()
  @IsUUID()
  deductionTypeId: string;

  @ApiProperty()
  @IsUUID()
  propertyNatureTypeId: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z', description: 'Date représentant le mois' })
  @IsDateString()
  month: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z', description: 'Date représentant l’année' })
  @IsDateString()
  year: string;

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
