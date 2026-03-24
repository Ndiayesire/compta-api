import { PartialType } from '@nestjs/mapped-types';
import { CreateRegionDto } from './create-dto.region';

export class UpdateRegionDto extends PartialType(CreateRegionDto) {}