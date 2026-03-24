import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({
    description: 'Permission name in format module:action',
    example: 'company:create',
    type: 'string'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Optional description of the permission',
    example: 'Allows creating new companies',
    type: 'string'
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Module name this permission belongs to',
    example: 'company',
    type: 'string'
  })
  @IsString()
  @IsNotEmpty()
  module: string;

  @ApiProperty({
    description: 'Action type for this permission',
    example: 'create',
    enum: ['create', 'read', 'update', 'delete'],
    type: 'string'
  })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiPropertyOptional({
    description: 'Whether the permission is active',
    example: true,
    default: true,
    type: 'boolean'
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}