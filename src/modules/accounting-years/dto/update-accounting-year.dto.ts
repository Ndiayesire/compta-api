import { PartialType } from '@nestjs/mapped-types';
import { CreateAccountingYearDto } from './create-accounting-year.dto';

export class UpdateAccountingYearDto extends PartialType(
  CreateAccountingYearDto,
) {}
