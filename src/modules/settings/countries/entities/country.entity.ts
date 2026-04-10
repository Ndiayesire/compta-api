import { Country } from '@prisma/client';
import { RegionEntity } from '../../regions/entities/region.entity';
import { CurrencyEntity } from '../../currency/entities/currency.entity';

export class CountryEntity implements Country {
  id: string;
  currencyId: string;
  name: string;
  code: string;
  tva: number;
  callingCode: string;
  isActive: boolean;

  regions?: RegionEntity[];
  currency?: CurrencyEntity;
}
