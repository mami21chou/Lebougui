// ═══════════════════════════════════════════════════════════
// VALIDATEURS LEBOUGUI
// Règles métier pour la validation des formulaires
// ═══════════════════════════════════════════════════════════

// ─── Constantes ───
export const PREFIXES_TELEPHONE_VALIDES = ['70', '75', '76', '77', '78'];
export const LONGUEUR_TELEPHONE = 9;
export const LONGUEUR_CODE_PIN = 4;

// ─── Regex ───
const REGEX_CHIFFRES = /^\d+$/;
const REGEX_LETTRES = /^[a-zA-ZÀ-ÿ\s'-]+$/;
const REGEX_CONTIENT_LETTRE = /[a-zA-ZÀ-ÿ]/;

// ═══════════════════════════════════════════════════════════
// VALIDATEURS D'INSCRIPTION
// Chaque fonction retourne null (OK) ou un message d'erreur
// ═══════════════════════════════════════════════════════════

export const validators = {
  // ─── Prénom ───
  prenom: (v) => {
    if (!v?.trim()) return 'Le prénom est obligatoire';
    if (!REGEX_LETTRES.test(v.trim()))
      return 'Le prénom ne doit contenir que des lettres';
    if (v.trim().length < 2)
      return 'Le prénom doit contenir au moins 2 lettres';
    return null;
  },

  // ─── Nom ───
  nom: (v) => {
    if (!v?.trim()) return 'Le nom est obligatoire';
    if (!REGEX_LETTRES.test(v.trim()))
      return 'Le nom ne doit contenir que des lettres';
    if (v.trim().length < 2)
      return 'Le nom doit contenir au moins 2 lettres';
    return null;
  },

  // ─── Téléphone (9 chiffres, préfixe sénégalais) ───
  telephone: (v) => {
    if (!v?.trim()) return 'Le numéro est obligatoire';
    if (!REGEX_CHIFFRES.test(v))
      return 'Le numéro ne doit contenir que des chiffres';
    if (v.length !== LONGUEUR_TELEPHONE)
      return `Le numéro doit contenir exactement ${LONGUEUR_TELEPHONE} chiffres`;
    const prefixe = v.substring(0, 2);
    if (!PREFIXES_TELEPHONE_VALIDES.includes(prefixe))
      return `Le numéro doit commencer par ${PREFIXES_TELEPHONE_VALIDES.join(', ')}`;
    return null;
  },

  // ─── Code PIN (4 chiffres) ───
  code_pin: (v) => {
    if (!v?.trim()) return 'Le code PIN est obligatoire';
    if (!REGEX_CHIFFRES.test(v))
      return 'Le code PIN ne doit contenir que des chiffres';
    if (v.length !== LONGUEUR_CODE_PIN)
      return `Le code PIN doit contenir exactement ${LONGUEUR_CODE_PIN} chiffres`;
    return null;
  },

  // ─── Adresse (au moins 1 lettre) ───
  adresse: (v) => {
    if (!v?.trim()) return "L'adresse est obligatoire";
    if (!REGEX_CONTIENT_LETTRE.test(v))
      return "L'adresse doit contenir au moins une lettre";
    if (v.trim().length < 3) return "L'adresse est trop courte";
    return null;
  },

  // ─── Immatriculation (livreur uniquement) ───
  immatriculation: (v, formData) => {
    if (formData?.role !== 'livreur') return null;
    if (!v?.trim())
      return "L'immatriculation est obligatoire pour un livreur";
    if (v.trim().length < 4) return "L'immatriculation est trop courte";
    return null;
  },
};

// ═══════════════════════════════════════════════════════════
// FONCTIONS DE FILTRAGE (pour les inputs en temps réel)
// ═══════════════════════════════════════════════════════════

/**
 * Filtre une saisie utilisateur selon le champ.
 * Retourne la valeur nettoyée.
 */
export const filtrerSaisie = (champ, valeur) => {
  switch (champ) {
    case 'telephone':
      // Chiffres uniquement, max 9
      return valeur.replace(/\D/g, '').slice(0, LONGUEUR_TELEPHONE);

    case 'code_pin':
      // Chiffres uniquement, max 4
      return valeur.replace(/\D/g, '').slice(0, LONGUEUR_CODE_PIN);

    case 'prenom':
    case 'nom':
      // Retire les chiffres
      return valeur.replace(/[0-9]/g, '');

    default:
      return valeur;
  }
};

// ═══════════════════════════════════════════════════════════
// VALIDATION GLOBALE D'UN FORMULAIRE
// ═══════════════════════════════════════════════════════════

/**
 * Valide tous les champs d'un formulaire selon les règles définies.
 * Retourne un objet { champ: messageErreur } (vide si tout est OK).
 */
export const validerFormulaire = (formData) => {
  const erreurs = {};

  Object.keys(validators).forEach((champ) => {
    const erreur = validators[champ](formData[champ], formData);
    if (erreur) erreurs[champ] = erreur;
  });

  return erreurs;
};