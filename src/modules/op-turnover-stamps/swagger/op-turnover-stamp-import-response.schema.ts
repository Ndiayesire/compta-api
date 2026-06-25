/** Schéma Swagger pour la réponse `POST /op-turnover-stamps/import`. */
export const OP_TURNOVER_STAMP_IMPORT_RESPONSE_SCHEMA = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const, example: true },
    message: {
      type: 'string' as const,
      example: 'Import timbres CA : 2 créé(s), 0 ligne(s) en erreur',
    },
    data: {
      type: 'object' as const,
      properties: {
        createdCount: { type: 'integer' as const, example: 2 },
        failedCount: { type: 'integer' as const, example: 0 },
        linkedCount: {
          type: 'integer' as const,
          description: 'Timbres rattachés à un CA existant (N° facture trouvé)',
          example: 1,
        },
        unlinkedCount: {
          type: 'integer' as const,
          description: 'Timbres créés sans CA lié (N° facture inconnu)',
          example: 1,
        },
        created: {
          type: 'array' as const,
          items: { type: 'object' as const },
        },
        errors: {
          type: 'array' as const,
          items: {
            type: 'object' as const,
            properties: {
              row: { type: 'integer' as const, example: 4 },
              message: { type: 'string' as const, example: 'TSE A PAYER invalide ou manquant' },
            },
          },
        },
      },
    },
  },
};
