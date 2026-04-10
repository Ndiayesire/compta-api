import { IsString, IsOptional, IsBoolean, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCurrencyDto {
  @IsString()
  @Length(2, 8)
  @ApiProperty({
    description: 'Currency code (e.g. ISO 4217)',
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
  @IsBoolean()
  @ApiPropertyOptional({
    description: 'Whether the currency is active',
    example: true,
  })
  isActive?: boolean;
}
