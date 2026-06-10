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

export class CreateOpExportationDto {
  @ApiProperty()
  @IsUUID()
  tierId: string;

  @ApiProperty()
  @IsUUID()
  countryId: string;

  @ApiProperty({ example: 'EXP-2025-001' })
  @IsString()
  @MaxLength(255)
  code: string;

  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  month: number;

  @ApiProperty({ example: 2025 })
  @Type(() => Number)
  @IsInt()
  year: number;

  @ApiProperty({ example: '2025-03-15T00:00:00.000Z' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  net?: number;

  @ApiPropertyOptional({ example: 90000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  tax?: number;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxDeduction?: number;

  @ApiPropertyOptional({ example: 590000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  total?: number;

  @ApiPropertyOptional({ example: 0.75 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  prorata?: number;
}
