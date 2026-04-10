import { IsString, IsNotEmpty, IsOptional, IsEmail, IsBoolean, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'amine.yamal@seneweb.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User password (minimum 8 characters)',
    example: 'Senegal1234',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({ description: 'Role ID', example: 'role-uuid-123' })
  @IsString()
  @IsNotEmpty()
  roleId: string;

  @ApiProperty({ description: 'Country (settings) ID', example: 'country-uuid-123' })
  @IsString()
  @IsNotEmpty()
  countryId: string;

  @ApiProperty({ description: 'Region (settings) ID', example: 'region-uuid-123' })
  @IsString()
  @IsNotEmpty()
  regionId: string;

  @ApiProperty({ description: 'Language (settings) ID', example: 'language-uuid-123' })
  @IsString()
  @IsNotEmpty()
  languageId: string;

  @ApiProperty({ description: 'Gender (settings) ID', example: 'gender-uuid-123' })
  @IsString()
  @IsNotEmpty()
  genderId: string;

  @ApiPropertyOptional({
    description: 'First name of the user',
    example: 'Lamine',
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Last name of the user',
    example: 'Yamal',
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+221770123456',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Postal / street address' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.jpg',
  })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional({
    description: 'Is the user active?',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
