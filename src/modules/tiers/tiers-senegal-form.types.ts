/** Données pour le modèle « État trimestriel » (DGID) — zone déclarant + ligne(s) bénéficiaire(s). */
export type SenegalQuarterlyFormData = {
  /** Texte dans la petite case à côté du titre (ex. T1, T2 ou libellé trimestre). */
  trimestreLibelle: string;
  declarant: {
    raisonSociale: string;
    sigle: string;
    forme: string;
    profession: string;
    nineaDigits: string[];
    adresse: string;
    rueDetail: string;
    quartier: string;
    localite: string;
    bp: string;
    tel: string;
  };
  /** Renseigné uniquement via `client.meta` (pas la société cabinet). */
  comptable: {
    nomEtAdresse: string;
    bp: string;
    tel: string;
  };
  exercice: { du: string; au: string };
  /** Une ligne par tiers du client (transactions / bénéficiaires). */
  beneficiaries: Array<{
    nom: string;
    adresse: string;
    montantVerse: string;
    irRetenu: string;
    periode: string;
    ninea: string;
  }>;
};
