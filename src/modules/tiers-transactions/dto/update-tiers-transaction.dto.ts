import { PartialType } from '@nestjs/mapped-types';
import { CreateTiersTransactionDto } from './create-tiers-transaction.dto';

export class UpdateTiersTransactionDto extends PartialType(
  CreateTiersTransactionDto,
) {}
