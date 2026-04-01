import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClientTypeDto {
  @ApiProperty({
    description: 'Client type name (unique code, uppercase recommended)',
    example: 'Entreprise'
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}