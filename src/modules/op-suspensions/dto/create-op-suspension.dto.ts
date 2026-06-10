import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNumber, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateOpSuspensionDto {
  @ApiProperty()
  @IsUUID()
  tierId: string;

  @ApiProperty({ example: 'SUS-2025-001' })
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

  @ApiProperty({ example: 590000 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  total: number;

  @ApiProperty({ example: '2025-04-01T00:00:00.000Z' })
  @IsDateString()
  visaDate: string;

  @ApiProperty({ example: 'VISA-12345' })
  @IsString()
  @MaxLength(255)
  visaNumber: string;
}
