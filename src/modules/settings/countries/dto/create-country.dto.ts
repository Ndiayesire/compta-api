import { IsString, IsNotEmpty, IsOptional, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCountryDto {
  @ApiProperty({
    description: 'Country name',
    example: 'Senegal'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Country code (2-3 characters)',
    example: 'SN'
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 3)
  code: string;

  @ApiPropertyOptional({
    description: 'Region ID',
    example: 'region-uuid-123'
  })
  @IsString()
  @IsOptional()
  regionId?: string;
}