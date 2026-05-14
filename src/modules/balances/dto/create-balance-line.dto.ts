import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Champs d’une ligne de balance (sans `balanceId` : fourni en URL à l’import Excel).
 * Sert de schéma commun pour la mise à jour partielle.
 */
export class CreateBalanceLineDto {
  @ApiProperty({ example: '40110000' })
  @IsString()
  @MaxLength(255)
  number: string;

  @ApiProperty({ example: 'Fournisseurs' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  previousSold: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  previousIsDebit?: boolean;

  @ApiProperty({ example: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  debit: number;

  @ApiProperty({ example: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  credit: number;

  @ApiProperty({ example: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  currentSold: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  currentIsDebit?: boolean;
}
