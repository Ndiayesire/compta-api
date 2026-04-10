import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentMethodDto {
  @ApiProperty({ description: 'Payment method type ID', example: 'pmt-type-uuid' })
  @IsUUID()
  typeId: string;

  @ApiProperty({
    description: 'Payment method name',
    example: 'Orange Money',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Code; may be empty',
    example: '',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ description: 'Avatar URL or icon key', example: '/icons/om.png' })
  @IsString()
  @IsNotEmpty()
  avatar: string;

  @ApiPropertyOptional({
    description: 'Is this payment method active?',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
