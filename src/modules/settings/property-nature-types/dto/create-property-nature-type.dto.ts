import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePropertyNatureTypeDto {
  @ApiProperty({ example: '1' })
  @IsString()
  @MaxLength(255)
  code: string;

  @ApiProperty({ example: 'MARCHANDISES' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
