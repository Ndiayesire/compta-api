import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateRentalDto } from './create-rental.dto';

export class UpdateRentalDto extends PartialType(
  OmitType(CreateRentalDto, ['clientId'] as const),
) {}
