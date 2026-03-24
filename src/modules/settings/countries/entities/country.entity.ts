import { Country } from '@prisma/client';
import { RegionEntity } from '../../regions/entities/region.entity';

export class CountryEntity implements Country {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  regionId: string | null;
  createdAt: Date;
  updatedAt: Date;

  region?: RegionEntity;
}