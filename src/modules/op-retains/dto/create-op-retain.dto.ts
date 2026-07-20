import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNumber, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateOpRetainDto {
  @ApiProperty()
  @IsUUID()
  tierId: string;

  @ApiProperty({ example: 'RET-2025-001' })
  @IsString()
  @MaxLength(255)
  code: string;

  @ApiProperty({ example: '2025-03-15T00:00:00.000Z' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  month: number;

  @ApiProperty({ example: 2025 })
  @Type(() => Number)
  @IsInt()
  year: number;

  @ApiProperty({ example: 1000000, description: 'Base (peut être négative)' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  base: number;

  @ApiProperty({ example: 5, description: 'Taux (peut être négatif)' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  rate: number;

  @ApiProperty({ example: 50000, description: 'Montant (peut être négatif)' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  amount: number;
}
