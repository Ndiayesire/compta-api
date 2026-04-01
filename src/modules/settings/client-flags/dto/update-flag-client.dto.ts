import { PartialType } from '@nestjs/mapped-types';
import { CreateFlagClientDto } from './create-flag-client.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFlagClientDto extends PartialType(CreateFlagClientDto) {
  @ApiPropertyOptional({ description: 'Name of the client flag', example: 'VIP Client' })
  name?: string;

  @ApiPropertyOptional({ description: 'Unique code for the flag', example: 'VIP' })
  code?: string;

  @ApiPropertyOptional({ description: 'Class of the flag', example: 'A' })
  class?: string;

  @ApiPropertyOptional({ description: 'Is the flag active?', example: true })
  isActive?: boolean;
}