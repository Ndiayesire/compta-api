import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsNumber,
  Min,
  IsObject,
} from 'class-validator';

export class CreateDocumentDto {
  @ApiProperty({ description: 'Document category ID' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: 'facture_2025_01.pdf' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Storage path or key (set after upload)',
    example: '/uploads/company/2025/facture_01.pdf',
  })
  @IsString()
  @IsNotEmpty()
  path: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty({ example: 102400 })
  @IsNumber()
  @Min(0)
  size: number;

  @ApiPropertyOptional({ example: {} })
  @IsObject()
  @IsOptional()
  meta?: Record<string, unknown>;
}
