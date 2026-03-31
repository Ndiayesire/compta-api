import { PartialType } from '@nestjs/mapped-types';
import { CreateLegalFormDto } from './create-legal-form.dto';

export class UpdateLegalFormDto extends PartialType(CreateLegalFormDto) {}