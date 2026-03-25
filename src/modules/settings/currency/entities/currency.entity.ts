import { Currency } from '@prisma/client';
import { CompanyEntity } from '../../../company/entities/company.entity';

export class CurrencyEntity implements Currency {
  id: string;
  code: string;        // ex: XOF, EUR
  name: string;        // ex: Franc CFA, Euro
  symbol: string | null; // ex: CFA, €
  decimals: number;    // ex: 2
  isPrefix: boolean;   // symbole avant le montant
  isActive: boolean;   // soft delete
  createdAt: Date;
  updatedAt: Date;
  companies?: CompanyEntity[];
}