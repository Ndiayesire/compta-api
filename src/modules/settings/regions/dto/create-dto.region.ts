import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRegionDto {
  @ApiProperty({
    description: 'Region name',
    example: 'Thies'
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}