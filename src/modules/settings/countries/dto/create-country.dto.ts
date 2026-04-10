import { IsString, IsNotEmpty, IsOptional, Length, IsUUID, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCountryDto {
  @ApiProperty({ description: 'Linked currency ID', example: 'currency-uuid-123' })
  @IsUUID()
  currencyId: string;

  @ApiProperty({
    description: 'Country name',
    example: 'Senegal',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Country code (2-3 characters)',
    example: 'SN',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 3)
  code: string;

  @ApiProperty({ description: 'Default TVA rate (e.g. 18)', example: 18 })
  @IsNumber()
  tva: number;

  @ApiProperty({ description: 'International calling code', example: '+221' })
  @IsString()
  @IsNotEmpty()
  callingCode: string;

  @ApiPropertyOptional({ description: 'Active', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
