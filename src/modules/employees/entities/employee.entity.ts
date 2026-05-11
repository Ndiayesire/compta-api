import { Employee } from '@prisma/client';

export class EmployeeEntity implements Employee {
  id: string;
  clientId: string;
  identificationTypeId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
  socialInsuranceNumber: string | null;
  identityNumber: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
