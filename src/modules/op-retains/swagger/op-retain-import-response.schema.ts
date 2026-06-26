/** Schéma Swagger pour la réponse `POST /op-retains/import`. */
export const OP_RETAIN_IMPORT_RESPONSE_SCHEMA = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const, example: true },
    message: {
      type: 'string' as const,
      example: 'Import retenues : 2 créé(s), 0 ligne(s) en erreur',
    },
    data: {
      type: 'object' as const,
      properties: {
        createdCount: { type: 'integer' as const, example: 2 },
        failedCount: { type: 'integer' as const, example: 0 },
        tiersCreatedCount: { type: 'integer' as const, example: 1 },
        created: {
          type: 'array' as const,
          description: 'Retenues créées (tier inclus)',
          items: { type: 'object' as const },
        },
        errors: {
          type: 'array' as const,
          items: {
            type: 'object' as const,
            properties: {
              row: { type: 'integer' as const, example: 3 },
              message: { type: 'string' as const, example: 'Fournisseur vide' },
            },
          },
        },
      },
    },
  },
};
