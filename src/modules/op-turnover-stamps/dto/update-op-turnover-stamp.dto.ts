import { PartialType, OmitType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, ValidateIf } from 'class-validator';
import { CreateOpTurnoverStampDto } from './create-op-turnover-stamp.dto';

export class UpdateOpTurnoverStampDto extends PartialType(
  OmitType(CreateOpTurnoverStampDto, ['opTurnoverId'] as const),
) {
  @ApiPropertyOptional({
    nullable: true,
    description: 'UUID du CA parent — `null` pour détacher le timbre',
  })
  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @IsUUID()
  opTurnoverId?: string | null;
}
