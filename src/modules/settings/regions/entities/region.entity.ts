import { Region } from '@prisma/client';

export class RegionEntity implements Region {
  id: string;
  name: string;
  countryId: string;
  code: string;
  isActive: boolean;
}
