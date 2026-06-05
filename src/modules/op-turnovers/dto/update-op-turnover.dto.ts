import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateOpTurnoverDto } from './create-op-turnover.dto';

export class UpdateOpTurnoverDto extends PartialType(
  OmitType(CreateOpTurnoverDto, ['clientId'] as const),
) {}
