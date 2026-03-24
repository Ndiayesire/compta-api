// src/company/entities/company.entity.ts
import { Company, CompanyStatus, LegalForm } from '@prisma/client';
import { CountryEntity } from '../../settings/countries/entities/country.entity';
import { RegionEntity } from '../../settings/regions/entities/region.entity';
import { PaymentMethodEntity } from '../../settings/payment-methods/entities/payment-method.entity';

export class CompanyEntity implements Company {
  id: string;

  // Identité légale
  name: string;
  siret: string | null;
  vatNumber: string | null;
  legalForm: LegalForm;
  status: CompanyStatus;
  nafCode: string | null;

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
  currencyCode: string | null;
  fiscalYearStart: Date | null;
  fiscalYearEnd: Date | null;
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
  paymentMethods?: PaymentMethodEntity[];
}