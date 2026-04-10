import { Company } from '@prisma/client';
import { RegionEntity } from '../../settings/regions/entities/region.entity';
import { CountryEntity } from '../../settings/countries/entities/country.entity';
import { LegalFormEntity } from '../../settings/legal-forms/entities/legal-form.entity';

export class CompanyEntity implements Company {
  id: string;
  userId: string;
  countryId: string;
  regionId: string;
  legalFormId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  ninea: string;
  useTva: boolean;
  reference: string;
  meta: Company['meta'];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  country?: CountryEntity;
  region?: RegionEntity;
  legalForm?: LegalFormEntity;
}
