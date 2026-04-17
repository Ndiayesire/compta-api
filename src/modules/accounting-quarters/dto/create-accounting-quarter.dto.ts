import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAccountingQuarterDto {
  @ApiProperty({ description: 'Parent accounting year ID' })
  @IsUUID()
  accountingYearId: string;

  @ApiProperty({ example: 'T1 2025' })
  @IsString()
  name: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  @IsDateString()
  monthStartDate: string;

  @ApiProperty({ example: '2025-03-31T00:00:00.000Z' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
