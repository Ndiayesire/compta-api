import { Client } from '@prisma/client';
import { CompanyEntity } from '../../company/entities/company.entity';
import { CountryEntity } from '../../settings/countries/entities/country.entity';
import { RegionEntity } from '../../settings/regions/entities/region.entity';
import { LegalFormEntity } from '../../settings/legal-forms/entities/legal-form.entity';

export class ClientEntity implements Client {
  id: string;
  userId: string;
  companyId: string;
  countryId: string;
  regionId: string;
  legalFormId: string;
  name: string;
  address: string;
  ninea: string;
  useTva: boolean;
  meta: Client['meta'];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  company?: CompanyEntity;
  country?: CountryEntity;
  region?: RegionEntity;
  legalForm?: LegalFormEntity;
}
