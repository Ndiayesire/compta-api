/** Schéma JSON partagé pour l’enveloppe `{ success, message, data }`. */
export const API_ENVELOPE_SCHEMA = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const, example: true },
    message: { type: 'string' as const },
    data: {
      description: 'Charge utile (objet, tableau ou null)',
    },
  },
  required: ['success', 'message'],
};
