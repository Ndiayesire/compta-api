import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CreateProviderDto {
  @ApiProperty({ example: '001234567' })
  @IsString()
  @MaxLength(255)
  ninea: string;

  @ApiProperty({ example: 'COFI-001' })
  @IsString()
  @MaxLength(255)
  cofi: string;

  @ApiProperty({ example: 'Fournisseur Dakar SARL' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'Zone industrielle' })
  @IsString()
  @MaxLength(255)
  address: string;
}
