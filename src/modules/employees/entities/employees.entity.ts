import { Employee } from '@prisma/client';
import { ContractTypeEntity } from '../../settings/contract-types/entities/contract-type.entity';

export class EmployeeEntity implements Employee {
  id: string;

  clientId: string;
  contractTypeId: string;

  firstName: string;
  lastName: string;

  jobTitle: string;

  department: string | null;

  email: string;
  phone: string | null;

  isActive: boolean;

  startDate: Date;
  endDate: Date | null;

  deletedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;

  contractType?: ContractTypeEntity;
}