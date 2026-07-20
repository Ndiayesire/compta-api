import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsObject, IsOptional, IsUUID } from 'class-validator';

export class CreateOpTurnoverStampDto {
  @ApiPropertyOptional({ description: 'UUID du CA parent — optionnel si timbre orphelin' })
  @IsOptional()
  @IsUUID()
  opTurnoverId?: string;

  @ApiProperty({ example: '2025-03-31T00:00:00.000Z' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 820000, description: 'Montant HT (peut être négatif)' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  net: number;

  @ApiProperty({ example: 180000, description: 'TVA (peut être négative)' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  tax: number;

  @ApiProperty({ example: 1000000, description: 'TTC (peut être négatif)' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  total: number;

  @ApiProperty({ example: {} })
  @IsObject()
  amount: Record<string, unknown>;

  @ApiProperty({ example: {} })
  @IsObject()
  amountDeduction: Record<string, unknown>;
}
