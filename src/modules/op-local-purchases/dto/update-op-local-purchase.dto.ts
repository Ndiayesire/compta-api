import { PartialType } from '@nestjs/mapped-types';
import { CreateOpLocalPurchaseDto } from './create-op-local-purchase.dto';

export class UpdateOpLocalPurchaseDto extends PartialType(CreateOpLocalPurchaseDto) {}
