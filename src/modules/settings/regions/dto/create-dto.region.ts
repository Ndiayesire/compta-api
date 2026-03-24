import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRegionDto {
  @ApiProperty({
    description: 'Region name',
    example: 'Dakar',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Country ID this region belongs to',
    example: 'uuid-of-country',
  })
  @IsUUID()
  @IsNotEmpty()
  countryId: string;
}