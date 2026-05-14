import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRentalDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  rentalUsageId: string;

  @ApiProperty({ example: 'Local Plateau' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: '12 av. Bourguiba' })
  @IsString()
  @MaxLength(255)
  address: string;

  @ApiProperty({ example: 'M. Diop' })
  @IsString()
  @MaxLength(255)
  owner: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  useTax?: boolean;

  @ApiProperty({ example: 250000.5 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  value: number;

  @ApiPropertyOptional({ example: {} })
  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;
}
