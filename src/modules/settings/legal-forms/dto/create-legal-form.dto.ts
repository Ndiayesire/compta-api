import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLegalFormDto {
  @ApiProperty({ description: 'Legal form name', example: 'SARL' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Société à Responsabilité Limitée' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Is active', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}