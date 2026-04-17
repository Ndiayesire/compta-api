import { Prisma } from '@prisma/client';

/** Prisma include pour export modèle Excel (déclarant = client, sans société cabinet). */
export const TIER_EXPORT_INCLUDE = {
  tierType: true,
  client: {
    include: {
      country: true,
      region: true,
      legalForm: true,
    },
  },
} satisfies Prisma.TierInclude;

export type TierForExport = Prisma.TierGetPayload<{
  include: typeof TIER_EXPORT_INCLUDE;
}>;

export type ClientForExport = TierForExport['client'];
