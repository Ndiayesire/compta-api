import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateOpExemptionDto {
  @ApiProperty()
  @IsUUID()
  tierId: string;

  @ApiProperty({ example: 'EXM-2025-001' })
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

  @ApiProperty({ example: 250000 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @ApiProperty({ example: 'Exonération partielle sur opérations export' })
  @IsString()
  desc: string;
}
