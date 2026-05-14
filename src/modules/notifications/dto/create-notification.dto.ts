import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({ example: 'Nouvelle facture' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Une facture a été ajoutée pour votre société.' })
  @IsString()
  @IsNotEmpty()
  desc: string;

  @ApiProperty({ example: 'text-info' })
  @IsString()
  @IsNotEmpty()
  styleClass: string;

  @ApiProperty({ example: 'pi pi-bell' })
  @IsString()
  @IsNotEmpty()
  icon: string;

  @ApiProperty({ example: '/invoices/123' })
  @IsString()
  @IsNotEmpty()
  link: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({ example: {} })
  @IsObject()
  @IsOptional()
  meta?: Record<string, unknown>;
}
