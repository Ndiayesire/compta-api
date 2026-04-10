import { Language } from '@prisma/client';

export class LanguageEntity implements Language {
  id: string;
  countryId: string;
  name: string;
  code: string;
  isActive: boolean;
}
