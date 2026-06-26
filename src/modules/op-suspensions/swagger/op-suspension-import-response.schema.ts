/** Schéma Swagger pour la réponse `POST /op-suspensions/import`. */
export const OP_SUSPENSION_IMPORT_RESPONSE_SCHEMA = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const, example: true },
    message: {
      type: 'string' as const,
      example: 'Import suspensions : 2 créé(s), 0 ligne(s) en erreur',
    },
    data: {
      type: 'object' as const,
      properties: {
        createdCount: { type: 'integer' as const, example: 2 },
        failedCount: { type: 'integer' as const, example: 0 },
        tiersCreatedCount: { type: 'integer' as const, example: 1 },
        tiersUpdatedCount: { type: 'integer' as const, example: 0 },
        created: {
          type: 'array' as const,
          description: 'Suspensions créées (tier inclus)',
          items: { type: 'object' as const },
        },
        errors: {
          type: 'array' as const,
          items: {
            type: 'object' as const,
            properties: {
              row: { type: 'integer' as const, example: 3 },
              message: { type: 'string' as const, example: 'NINEA ou dénomination client requis' },
            },
          },
        },
      },
    },
  },
};
