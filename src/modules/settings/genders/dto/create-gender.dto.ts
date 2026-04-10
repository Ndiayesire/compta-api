import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateGenderDto {
  @ApiProperty({ example: 'Masculin' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'M' })
  @IsString()
  code: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
