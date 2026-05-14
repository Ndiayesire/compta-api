import { PartialType } from '@nestjs/mapped-types';
import { CreateRentalUsageDto } from './create-rental-usage.dto';

export class UpdateRentalUsageDto extends PartialType(CreateRentalUsageDto) {}
