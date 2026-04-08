// dto/create-contract-type.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateContractTypeDto {
  @ApiProperty({ example: 'Contrat à durée indéterminée' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'CDI' })
  @IsString()
  code: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}