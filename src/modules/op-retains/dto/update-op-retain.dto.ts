import { PartialType } from '@nestjs/mapped-types';
import { CreateOpRetainDto } from './create-op-retain.dto';

export class UpdateOpRetainDto extends PartialType(CreateOpRetainDto) {}
