import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateBalanceDto } from './create-balance.dto';

export class UpdateBalanceDto extends PartialType(
  OmitType(CreateBalanceDto, ['clientId', 'accountingYearId'] as const),
) {}
