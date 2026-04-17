import { PartialType } from '@nestjs/mapped-types';
import { CreateAppMetaDto } from './create-app-meta.dto';

export class UpdateAppMetaDto extends PartialType(CreateAppMetaDto) {}
