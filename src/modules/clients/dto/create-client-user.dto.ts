import { IsString, IsNotEmpty, IsOptional, IsEmail, IsBoolean, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Contact / portal user created with the client (`clients.user_id` → new user). */
export class CreateClientUserDto {
  @ApiProperty({ description: 'User email (login)', example: 'contact@client.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Password (minimum 8 characters)', example: 'SecurePass12' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({ description: 'Role ID', example: 'role-uuid-123' })
  @IsString()
  @IsNotEmpty()
  roleId: string;

  @ApiProperty({ description: 'Country ID (settings)', example: 'country-uuid-123' })
  @IsString()
  @IsNotEmpty()
  countryId: string;

  @ApiProperty({ description: 'Region ID (settings)', example: 'region-uuid-123' })
  @IsString()
  @IsNotEmpty()
  regionId: string;

  @ApiProperty({ description: 'Language ID (settings)', example: 'language-uuid-123' })
  @IsString()
  @IsNotEmpty()
  languageId: string;

  @ApiProperty({ description: 'Gender ID (settings)', example: 'gender-uuid-123' })
  @IsString()
  @IsNotEmpty()
  genderId: string;

  @ApiPropertyOptional({ description: 'First name', example: 'Jean' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name', example: 'Dupont' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+221770123456' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Address' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'Avatar URL' })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional({ description: 'Is the user active?', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
