import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLegalFormDto {
  @ApiProperty({ description: 'Legal form name', example: 'SARL' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Legal form code', example: 'SARL' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: 'Is active', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
