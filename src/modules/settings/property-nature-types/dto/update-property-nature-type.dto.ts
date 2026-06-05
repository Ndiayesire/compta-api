import { PartialType } from '@nestjs/mapped-types';
import { CreatePropertyNatureTypeDto } from './create-property-nature-type.dto';

export class UpdatePropertyNatureTypeDto extends PartialType(CreatePropertyNatureTypeDto) {}
