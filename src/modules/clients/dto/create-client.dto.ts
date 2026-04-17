import {
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateClientUserDto } from './create-client-user.dto';

export class CreateClientDto {
  @ApiProperty({ description: 'Client name', example: 'Aliou Ndiaye' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Address', example: 'Dakar, Senegal' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'Postal / ZIP code', example: '12500' })
  @IsString()
  postalCode: string;

  @ApiProperty({ description: 'NINEA', example: '123 456 789 00010' })
  @IsString()
  ninea: string;

  @ApiProperty({ description: 'Country ID (settings)', example: 'country-uuid-123' })
  @IsString()
  countryId: string;

  @ApiProperty({ description: 'Region ID (settings)', example: 'region-uuid-123' })
  @IsString()
  regionId: string;

  @ApiProperty({ description: 'Legal form ID (settings)', example: 'legalform-uuid-123' })
  @IsString()
  legalFormId: string;

  @ApiPropertyOptional({ description: 'Subject to TVA', example: true })
  @IsBoolean()
  @IsOptional()
  useTva?: boolean;

  @ApiPropertyOptional({ description: 'Arbitrary JSON metadata', example: {} })
  @IsObject()
  @IsOptional()
  meta?: Record<string, unknown>;

  @ApiPropertyOptional({
    description:
      'If set, creates this user and sets `client.user_id` to the new user (like company + user). If omitted, the current user is linked as contact.',
    type: CreateClientUserDto,
  })
  @ValidateNested()
  @Type(() => CreateClientUserDto)
  @IsOptional()
  user?: CreateClientUserDto;
}
