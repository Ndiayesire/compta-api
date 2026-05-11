import type { Prisma } from '@prisma/client';

export type TierLineForExport = {
  id: string;
  name: string;
  ninea: string;
  meta: Prisma.JsonValue;
};

export type TierSumsById = Map<
string,
  {
    montantVerse: number;
    irRetenu: number;
  }
>;
