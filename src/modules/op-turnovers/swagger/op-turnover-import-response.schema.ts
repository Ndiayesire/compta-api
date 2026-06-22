/** Schéma Swagger pour la réponse `POST /op-turnovers/import`. */
export const OP_TURNOVER_IMPORT_RESPONSE_SCHEMA = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const, example: true },
    message: {
      type: 'string' as const,
      example: 'Import chiffres d’affaires : 2 créé(s), 0 ligne(s) en erreur',
    },
    data: {
      type: 'object' as const,
      properties: {
        createdCount: { type: 'integer' as const, example: 2 },
        failedCount: { type: 'integer' as const, example: 0 },
        created: {
          type: 'array' as const,
          description: 'Chiffres d’affaires créés (client, stamps vides)',
          items: { type: 'object' as const },
        },
        errors: {
          type: 'array' as const,
          items: {
            type: 'object' as const,
            properties: {
              row: { type: 'integer' as const, example: 4 },
              message: { type: 'string' as const, example: 'N° facture manquant' },
            },
          },
        },
      },
    },
  },
};
