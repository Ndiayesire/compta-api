import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateActivityDto {
  @ApiProperty({ example: 'Facture validée' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'text-success' })
  @IsString()
  @IsNotEmpty()
  styleClass: string;

  @ApiProperty({ example: 'pi pi-check' })
  @IsString()
  @IsNotEmpty()
  icon: string;

  @ApiProperty({ example: 'La facture FAC-2025-001 a été validée.' })
  @IsString()
  @IsNotEmpty()
  desc: string;

  @ApiPropertyOptional({ example: {} })
  @IsObject()
  @IsOptional()
  meta?: Record<string, unknown>;
}
