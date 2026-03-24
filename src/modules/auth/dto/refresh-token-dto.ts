
import { IsEmail, IsNotEmpty, IsString, IsOptional, MinLength, IsArray } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}