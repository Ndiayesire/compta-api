import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDeductionTypeDto {
  @ApiProperty({ example: 'DED01' })
  @IsString()
  @MaxLength(255)
  code: string;

  @ApiProperty({ example: 'Déduction standard' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
