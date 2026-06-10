import { PartialType } from '@nestjs/mapped-types';
import { CreateOpExemptionDto } from './create-op-exemption.dto';

export class UpdateOpExemptionDto extends PartialType(CreateOpExemptionDto) {}
