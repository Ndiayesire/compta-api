import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateDocumentCategoryDto {
  @ApiProperty({ example: 'Facture' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'INVOICE' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
