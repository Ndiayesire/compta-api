import { PartialType } from '@nestjs/mapped-types';
import { CreateOpRoyaltyDto } from './create-op-royalty.dto';

export class UpdateOpRoyaltyDto extends PartialType(CreateOpRoyaltyDto) {}
