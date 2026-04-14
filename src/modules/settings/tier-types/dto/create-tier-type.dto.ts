import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateTierTypeDto {
  @ApiProperty({ example: 'Client' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'CUSTOMER' })
  @IsString()
  code: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
