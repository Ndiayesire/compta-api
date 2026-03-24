import { Region } from '@prisma/client';

export class RegionEntity implements Region {
  id: string;
  name: string;
  countryId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}