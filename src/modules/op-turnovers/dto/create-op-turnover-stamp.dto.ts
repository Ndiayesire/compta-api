import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsObject, IsUUID, Min } from 'class-validator';

export class CreateOpTurnoverStampDto {
  @ApiProperty()
  @IsUUID()
  opTurnoverId: string;

  @ApiProperty({ example: '2025-03-31T00:00:00.000Z' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 820000 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  net: number;

  @ApiProperty({ example: 180000 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  tax: number;

  @ApiProperty({ example: 1000000 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  total: number;

  @ApiProperty({ example: {} })
  @IsObject()
  amount: Record<string, unknown>;

  @ApiProperty({ example: {} })
  @IsObject()
  amountDeduction: Record<string, unknown>;
}
