import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';

export class CreateLanguageDto {
  @ApiProperty({ description: 'Country ID (settings countries)', example: 'a0000002-0000-4000-8000-000000000001' })
  @IsString()
  @IsNotEmpty()
  countryId: string;

  @ApiProperty({ example: 'Français' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'fr' })
  @IsString()
  code: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
