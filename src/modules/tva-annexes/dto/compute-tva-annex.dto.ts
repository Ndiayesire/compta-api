import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class ComputeTvaAnnexQueryDto {
  @ApiProperty({
    description: 'UUID du client — doit appartenir à la société du JWT',
    format: 'uuid',
    example: 'a0000021-0000-4000-8000-000000000001',
  })
  @IsUUID()
  clientId!: string;

  @ApiProperty({ description: 'Mois de déclaration (1–12)', example: 1, minimum: 1, maximum: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @ApiProperty({ description: 'Année de déclaration', example: 2025, minimum: 2000, maximum: 2100 })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @ApiPropertyOptional({
    description:
      'L40 — Part de la base taxable au taux réduit (HT). Défaut 0 (toute la base L35 au taux normal).',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  reducedBase?: number;

  @ApiPropertyOptional({
    description: 'L100 — Crédit de TVA reporté du mois précédent (L115 N-1). Défaut 0.',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  previousCredit?: number;

  @ApiPropertyOptional({
    description: 'L75 — Imputation de chèques DDI. Défaut 0.',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  checksDdi?: number;

  @ApiPropertyOptional({
    description: 'L30 — Prélèvements / livraisons à soi-même (informatif). Défaut 0.',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  selfSupplies?: number;

  @ApiPropertyOptional({
    description: 'Taux réduit en % (défaut 10).',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  reducedRate?: number;
}
