import { PartialType } from '@nestjs/swagger';
import { CreateEmployeeDto } from './create-employees.dto';

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {}
