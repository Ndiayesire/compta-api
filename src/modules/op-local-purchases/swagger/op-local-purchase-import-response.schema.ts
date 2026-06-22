/** Schéma Swagger pour la réponse `POST /op-local-purchases/import`. */
export const OP_LOCAL_PURCHASE_IMPORT_RESPONSE_SCHEMA = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const, example: true },
    message: {
      type: 'string' as const,
      example: 'Import achats locaux : 1 créé(s), 0 ligne(s) en erreur',
    },
    data: {
      type: 'object' as const,
      properties: {
        createdCount: { type: 'integer' as const, example: 1 },
        failedCount: { type: 'integer' as const, example: 0 },
        tiersCreatedCount: { type: 'integer' as const, example: 0 },
        tiersUpdatedCount: { type: 'integer' as const, example: 0 },
        deductionTypesCreatedCount: { type: 'integer' as const, example: 0 },
        propertyNatureTypesCreatedCount: { type: 'integer' as const, example: 0 },
        created: {
          type: 'array' as const,
          description: 'Achats locaux créés (tier, deductionType, propertyNatureType)',
          items: { type: 'object' as const },
        },
        errors: {
          type: 'array' as const,
          items: {
            type: 'object' as const,
            properties: {
              row: { type: 'integer' as const, example: 3 },
              message: { type: 'string' as const, example: 'FOURNISSEUR ou NINEA requis' },
            },
          },
        },
      },
    },
  },
};
