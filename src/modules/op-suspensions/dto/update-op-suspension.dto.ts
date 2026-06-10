import { PartialType } from '@nestjs/mapped-types';
import { CreateOpSuspensionDto } from './create-op-suspension.dto';

export class UpdateOpSuspensionDto extends PartialType(CreateOpSuspensionDto) {}
