import { PartialType } from '@nestjs/mapped-types';
import { CreateAccountingQuarterDto } from './create-accounting-quarter.dto';

export class UpdateAccountingQuarterDto extends PartialType(
  CreateAccountingQuarterDto,
) {}
