import { Company, CompanyStatus } from '@prisma/client';
import { CurrencyEntity } from '../../settings/currency/entities/currency.entity';
import { RegionEntity } from '../../settings/regions/entities/region.entity';
import { PaymentMethodEntity } from '../../settings/payment-methods/entities/payment-method.entity';
import { CountryEntity } from '../../settings/countries/entities/country.entity';
import { LegalFormEntity } from '../../settings/legal-forms/entities/legal-form.entity';

export class CompanyEntity implements Company {
  id: string;

  // Identité légale
  name: string;
  ninea: string | null;
  tva: string | null;
  legalFormId: string | null;
  status: CompanyStatus;
  reference: string | null;

  // Adresse
  address: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;

  // FK géographiques
  countryId: string | null;
  regionId: string | null;

  // Contact
  email: string | null;
  phone: string | null;
  website: string | null;

  // Fiscal
  currencyId: string | null;
  isHolding: boolean;

  // Métadonnées
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;

  // Relations
  country?: CountryEntity;
  region?: RegionEntity;
  currency?: CurrencyEntity;
  legalForm?: LegalFormEntity;
  paymentMethods?: PaymentMethodEntity[];
}