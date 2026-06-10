import { PartialType } from '@nestjs/mapped-types';
import { CreateOpExportationDto } from './create-op-exportation.dto';

export class UpdateOpExportationDto extends PartialType(CreateOpExportationDto) {}
