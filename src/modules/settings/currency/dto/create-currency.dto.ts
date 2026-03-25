import { IsString, IsOptional, IsInt, IsBoolean, Length, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCurrencyDto {
  @IsString()
  @Length(3, 3)
  @ApiProperty({
    description: 'Currency code (ISO 4217)',
    example: 'XOF',
  })
  code: string;

  @IsString()
  @ApiProperty({
    description: 'Full name of the currency',
    example: 'Franc CFA',
  })
  name: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Currency symbol',
    example: 'CFA',
    required: false,
  })
  symbol?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @ApiProperty({
    description: 'Number of decimals',
    example: 2,
    required: false,
  })
  decimals?: number;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'Whether symbol is prefix',
    example: false,
    required: false,
  })
  isPrefix?: boolean;
}