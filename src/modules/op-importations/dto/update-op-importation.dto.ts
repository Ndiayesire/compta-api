import { PartialType } from '@nestjs/mapped-types';
import { CreateOpImportationDto } from './create-op-importation.dto';

export class UpdateOpImportationDto extends PartialType(CreateOpImportationDto) {}
