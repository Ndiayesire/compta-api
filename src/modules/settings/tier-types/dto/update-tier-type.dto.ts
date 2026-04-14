import { PartialType } from '@nestjs/swagger';
import { CreateTierTypeDto } from './create-tier-type.dto';

export class UpdateTierTypeDto extends PartialType(CreateTierTypeDto) {}
