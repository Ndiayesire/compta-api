/**
 * Point d'entree retrocompatible pour la construction des donnees Senegal.
 * Le code est decoupe dans des sous-fichiers plus ciblés (types/helpers/builders).
 */
export type { TierLineForExport, TierSumsById } from './tiers-senegal-form.types';
export { buildSenegalAnnualFormData, buildSenegalQuarterlyFormData } from './tiers-senegal-form.builders';
