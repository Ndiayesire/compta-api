/** Schéma Swagger pour la réponse `POST /op-importations/import`. */
export const OP_IMPORTATION_IMPORT_RESPONSE_SCHEMA = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const, example: true },
    message: {
      type: 'string' as const,
      example: 'Import importations : 1 créée(s), 0 ligne(s) en erreur',
    },
    data: {
      type: 'object' as const,
      properties: {
        createdCount: { type: 'integer' as const, example: 1 },
        failedCount: { type: 'integer' as const, example: 0 },
        tiersCreatedCount: {
          type: 'integer' as const,
          example: 0,
          description: 'Fournisseurs créés (type SUPPLIER) pendant l’import',
        },
        countriesCreatedCount: {
          type: 'integer' as const,
          example: 0,
          description: 'Pays créés dans settings_countries',
        },
        deductionTypesCreatedCount: {
          type: 'integer' as const,
          example: 0,
          description: 'Types de déduction créés (code abrégé du nom)',
        },
        propertyNatureTypesCreatedCount: {
          type: 'integer' as const,
          example: 0,
          description: 'Natures de bien créées (code numérique incrémenté)',
        },
        created: {
          type: 'array' as const,
          description: 'Importations créées (relations tier, country, deductionType, propertyNatureType)',
          items: { type: 'object' as const },
        },
        errors: {
          type: 'array' as const,
          description: 'Erreurs par numéro de ligne Excel',
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
