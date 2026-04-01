import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFlagClientDto {
  @ApiProperty({ description: 'Name of the client flag', example: 'SUSPENDED' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Unique code for the flag', example: 'SUSP' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Class of the flag', example: 'badge-red' })
  @IsString()
  @IsNotEmpty()
  class: string;
}