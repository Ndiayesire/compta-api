import { TierType } from '@prisma/client';

export class TierTypeEntity implements TierType {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}
