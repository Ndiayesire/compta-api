import { Employee, ContractType } from '@prisma/client';

export class EmployeeEntity implements Employee {
  id: string;

  clientId: string;

  firstName: string;
  lastName: string;

  jobTitle: string;
  contractType: ContractType;

  department: string | null;

  email: string;
  phone: string | null;

  isActive: boolean;

  startDate: Date;
  endDate: Date | null;

  deletedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}