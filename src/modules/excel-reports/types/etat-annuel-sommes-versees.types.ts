/** Données pour le modèle « État annuel des sommes versées » (DGID) — déclarant + ligne(s) bénéficiaire(s). */
export type EtatAnnuelSommesVerseesFormData = {
  /** Texte dans la petite case à côté du titre (ex. année ou « Annuel »). */
  periodeAnnuelleLibelle: string;
  /** Nom de l'exercice (ex. Exercice 2025). */
  accountingYearName: string;
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
    postalCode: string;
    bp: string;
    tel: string;
  };
  comptable: {
    nomEtAdresse: string;
    bp: string;
    tel: string;
  };
  exercice: { du: string; au: string };
  beneficiaries: Array<{
    nom: string;
    adresse: string;
    montantVerse: string;
    irRetenu: string;
    periode: string;
    ninea: string;
  }>;
};
