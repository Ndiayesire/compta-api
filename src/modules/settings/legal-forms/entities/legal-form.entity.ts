import { LegalForm } from '@prisma/client';

export class LegalFormEntity implements LegalForm {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}
