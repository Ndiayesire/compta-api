import { ContractType } from '@prisma/client';

export class ContractTypeEntity implements ContractType {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}