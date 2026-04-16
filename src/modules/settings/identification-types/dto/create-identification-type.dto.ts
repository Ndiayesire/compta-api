import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateIdentificationTypeDto {
  @ApiProperty({ example: 'National ID' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'NID' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
