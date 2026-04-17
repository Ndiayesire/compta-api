import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateAccountingYearDto {
  @ApiProperty({ example: 'Exercice 2025' })
  @IsString()
  name: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2025-12-31T00:00:00.000Z' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
