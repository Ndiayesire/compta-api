import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTiersTransactionDto {
  @ApiProperty({ description: 'Tier ID (must belong to your company)' })
  @IsUUID()
  tierId: string;

  @ApiProperty({ description: 'External / business transaction reference' })
  @IsString()
  transactionId: string;

  @ApiProperty({ example: 1000.5 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  net: number;

  @ApiProperty({ example: 180.09 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  tax: number;

  @ApiProperty({ example: 1180.59 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total: number;

  @ApiProperty({ example: '2025-04-15T00:00:00.000Z' })
  @IsDateString()
  date: string;
}
