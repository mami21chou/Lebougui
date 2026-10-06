"""
publications/utils.py
Normalisation des noms d'espèces (crevette / Crevettes → crevette).
"""

import unicodedata


ESPECES_CANONIQUES = {
    # Poissons
    "thiof":      "thiof",
    "tiof":       "thiof",
    "tioff":      "thiof",
    "sole":       "sole",
    "waxande":    "sole",
    "mulet":      "mulet",
    "sall":       "mulet",
    "sal":        "mulet",
    "maquereau":  "maquereau",
    "kelle":      "maquereau",
    "kel":        "maquereau",
    "sardinelle": "sardinelle",
    "yaboy":      "sardinelle",
    "yabo":       "sardinelle",
    "capitaine":  "capitaine",
    "cobo":       "capitaine",
    "kobo":       "capitaine",
    "courbine":   "courbine",
    "mbosse":     "courbine",
    "thon":       "thon",
    "safar":      "thon",
    "dorade":     "dorade",
    "poisson":    "poisson",
    "jen":        "poisson",

    # Fruits de mer
    "crevette":   "crevette",
    "sokk":       "crevette",
    "sok":        "crevette",
    "poulpe":     "poulpe",
    "yokkute":    "poulpe",
    "yokute":     "poulpe",
    "crabe":      "crabe",
    "tank":       "crabe",
    "karabe":     "crabe",
    "thioxogn":   "crabe",
    "langouste":  "langouste",
    "langust":    "langouste",
    "calmar":     "calmar",
    "huitre":     "huitre",
}


def _normaliser_texte(texte: str) -> str:
    if not texte:
        return ""
    texte = texte.lower().strip()
    texte = unicodedata.normalize("NFKD", texte)
    return "".join(c for c in texte if not unicodedata.combining(c))


def normaliser_nom_espece(nom: str) -> str:
    """
    'crevette' / 'Crevettes' / 'CREVETTE' → 'crevette'
    """
    if not nom:
        return ""

    nom_clean = _normaliser_texte(nom)

    # Retrait du pluriel simple
    if nom_clean.endswith("s") and len(nom_clean) > 3:
        nom_singulier = nom_clean[:-1]
    else:
        nom_singulier = nom_clean

    if nom_singulier in ESPECES_CANONIQUES:
        return ESPECES_CANONIQUES[nom_singulier]
    if nom_clean in ESPECES_CANONIQUES:
        return ESPECES_CANONIQUES[nom_clean]

    return nom.strip().lower()