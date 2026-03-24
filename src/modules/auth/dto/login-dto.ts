import { IsEmail, IsNotEmpty, IsString, IsOptional, MinLength, IsArray } from 'class-validator';

export class LoginDtoValidation {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
