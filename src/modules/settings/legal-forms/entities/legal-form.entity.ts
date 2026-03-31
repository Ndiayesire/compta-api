import { LegalForm } from '@prisma/client';

export class LegalFormEntity implements LegalForm {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}