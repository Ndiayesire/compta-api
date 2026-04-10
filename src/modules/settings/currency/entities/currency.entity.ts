import { Currency } from '@prisma/client';

export class CurrencyEntity implements Currency {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}
