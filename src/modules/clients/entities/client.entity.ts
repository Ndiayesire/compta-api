import { Client } from '@prisma/client';
import { CompanyEntity } from '../../company/entities/company.entity';
import { ClientTypeEntity } from '../../settings/client-types/entities/client-type.entity';
import { ClientFlagEntity } from '../../settings/client-flags/entities/client-flag.entity';
import { CountryEntity } from '../../settings/countries/entities/country.entity';
import { RegionEntity } from '../../settings/regions/entities/region.entity';
import { CurrencyEntity } from '../../settings/currency/entities/currency.entity';
import { LegalFormEntity } from '../../settings/legal-forms/entities/legal-form.entity';

export class ClientEntity implements Client {
  id: string;

  // Company association
  companyId: string;

  // Types and flags
  clientTypeId: string | null;
  clientFlagId: string | null;

  // Geographical
  countryId: string | null;
  regionId: string | null;
  currencyId: string | null;

  // Legal
  legalFormId: string | null;
  siret: string | null;
  vatNumber: string | null;
  nafCode: string | null;

  // Identity
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;

  // Status
  isActive: boolean;
  deletedAt: Date | null;

  // Metadata
  createdAt: Date;
  updatedAt: Date;

  // Relations
  company?: CompanyEntity;
  clientType?: ClientTypeEntity;
  clientFlag?: ClientFlagEntity;
  country?: CountryEntity;
  region?: RegionEntity;
  currency?: CurrencyEntity;
  legalForm?: LegalFormEntity;
}