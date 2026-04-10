import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateClientDto } from './create-client.dto';

/** `user` is only for create; contact user is not updated via this DTO. */
export class UpdateClientDto extends PartialType(OmitType(CreateClientDto, ['user'])) {}
