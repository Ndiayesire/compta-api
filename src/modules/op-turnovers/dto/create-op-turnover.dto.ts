import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateOpTurnoverDto {
  @ApiProperty()
  @IsUUID()
  clientId: string;

  @ApiProperty({ example: 'CA-2025-001' })
  @IsString()
  @MaxLength(255)
  number: string;

  @ApiProperty({ example: '2025-03-31T00:00:00.000Z' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 1000000, description: 'Montant HT (peut être négatif)' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  net: number;

  @ApiProperty({ example: 180000, description: 'TVA (peut être négative)' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  tax: number;

  @ApiProperty({ example: 1180000, description: 'TTC (peut être négatif)' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  total: number;
}
