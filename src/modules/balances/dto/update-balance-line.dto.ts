import { PartialType } from '@nestjs/mapped-types';
import { CreateBalanceLineDto } from './create-balance-line.dto';

export class UpdateBalanceLineDto extends PartialType(CreateBalanceLineDto) {}
