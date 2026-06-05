import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateOpTurnoverStampDto } from './create-op-turnover-stamp.dto';

export class UpdateOpTurnoverStampDto extends PartialType(
  OmitType(CreateOpTurnoverStampDto, ['opTurnoverId'] as const),
) {}
