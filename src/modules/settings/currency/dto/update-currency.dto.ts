import { PartialType } from '@nestjs/mapped-types';
import { CreateCurrencyDto } from './create-currency.dto';
import { IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCurrencyDto extends PartialType(CreateCurrencyDto) {
  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'Set active/inactive status',
    example: true,
    required: false,
  })
  isActive?: boolean;
}