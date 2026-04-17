import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CreateAppMetaDto {
  @ApiProperty({ example: 'accounting_quarter_1' })
  @IsString()
  @MaxLength(255)
  key: string;

  @ApiProperty({
    example: '{"start_date":"01-01","end_date":"03-31"}',
  })
  @IsString()
  @MaxLength(255)
  value: string;
}
