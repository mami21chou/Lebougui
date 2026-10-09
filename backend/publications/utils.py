"""
publications/utils.py
Fonctions de normalisation pour les espèces et les zones de pêche.
"""

import unicodedata


# =========================================================
# DICTIONNAIRE DES ESPÈCES
# =========================================================

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


# =========================================================
# DICTIONNAIRE DES ZONES DE PÊCHE
# Clé = forme canonique (ce qui sera stocké)
# Valeur = liste d'alias / variantes entendues
# =========================================================

ZONES_CANONIQUES = {
    "Saint-Louis":   ["saint louis", "ndar", "sanlui", "san louis"],
    "Kayar":         ["kayar", "kayaar"],
    "Fass Boye":     ["fass boye", "fass boy", "fas boye"],
    "Mboro":         ["mboro"],
    "Lompoul":       ["lompoul"],
    "Yoff":          ["yoff", "yoof"],
    "Ngor":          ["ngor", "noor"],
    "Ouakam":        ["ouakam", "wakam"],
    "Soumbédioune":  ["soumbedioune", "sumbejun", "soumbejoune"],
    "Hann":          ["hann"],
    "Thiaroye":      ["thiaroye", "tiaroye", "caaroy"],
    "Mbao":          ["mbao"],
    "Rufisque":      ["rufisque", "rufisk", "ruufisk"],
    "Bargny":        ["bargny", "bargni"],
    "Yène":          ["yene"],
    "Toubab Dialaw": ["toubab dialaw", "tubab jalaw", "toubab dialao"],
    "Popenguine":    ["popenguine", "popenguin"],
    "Guéréo":        ["guereo"],
    "Somone":        ["somone"],
    "Ngaparou":      ["ngaparou"],
    "Mbour":         ["mbour", "mbuur"],
    "Nianing":       ["nianing"],
    "Pointe-Sarène": ["pointe sarene", "point sarene", "sarene"],
    "Joal":          ["joal", "jowaal", "joal fadiouth", "zool", "zool faajoot", "joal faajoot"],
    "Djiffer":       ["djiffer", "jiffer"],
    "Dionewar":      ["dionewar"],
    "Niodior":       ["niodior"],
    "Foundiougne":   ["foundiougne", "fundiyun"],
    "Missirah":      ["missirah"],
    "Sokone":        ["sokone"],
    "Toubacouta":    ["toubacouta", "toubakouta"],
    "Kafountine":    ["kafountine", "kafuntin"],
    "Diogué":        ["diogue"],
    "Cap Skirring":  ["cap skirring", "kap skiring", "cap skiring"],
    "Oussouye":      ["oussouye"],
    "Elinkine":      ["elinkine"],
    "Ziguinchor":    ["ziguinchor", "sigicoor", "ziginchor"],
    "Goudomp":       ["goudomp"],
    "Sédhiou":       ["sedhiou"],
    "Bignona":       ["bignona"],
    "Dakar":         ["dakar", "ndakarou"],
}


# =========================================================
# FONCTION INTERNE DE NORMALISATION
# =========================================================

def _normaliser_texte(texte: str) -> str:
    """
    Normalise un texte pour comparaison :
    - minuscules
    - suppression des accents
    - suppression des espaces superflus

    Ex : 'Soumbédioune', 'SOUMBEDIOUNE ', 'soumbedioune' → 'soumbedioune'
    """
    if not texte:
        return ""
    texte = texte.strip().lower()
    texte = unicodedata.normalize("NFKD", texte)
    return "".join(c for c in texte if not unicodedata.combining(c))


# ═══ Table de correspondance : forme normalisée → forme canonique ═══
_VARIANTES_ZONES = {}
for _canon, _aliases in ZONES_CANONIQUES.items():
    # Ajoute le nom canonique lui-même
    _VARIANTES_ZONES[_normaliser_texte(_canon)] = _canon
    # Ajoute tous les alias
    for _alias in _aliases:
        _VARIANTES_ZONES[_normaliser_texte(_alias)] = _canon


# =========================================================
# NORMALISATION DES ESPÈCES
# =========================================================

def normaliser_nom_espece(nom: str) -> str:
    """
    Normalise le nom d'une espèce :
    - 'crevette' / 'Crevettes' / 'CREVETTE' → 'crevette'
    - 'tiof' / 'Tioff' → 'thiof'
    - 'sokk' → 'crevette'
    """
    if not nom:
        return ""

    nom_clean = _normaliser_texte(nom)

    if nom_clean.endswith("s") and len(nom_clean) > 3:
        nom_singulier = nom_clean[:-1]
    else:
        nom_singulier = nom_clean

    if nom_singulier in ESPECES_CANONIQUES:
        return ESPECES_CANONIQUES[nom_singulier]
    if nom_clean in ESPECES_CANONIQUES:
        return ESPECES_CANONIQUES[nom_clean]

    return nom.strip().lower()


# =========================================================
# NORMALISATION DES ZONES DE PÊCHE
# =========================================================

def canoniser_zone(zone: str) -> str:
    """
    Transforme une zone en sa forme canonique :
    - 'soumbedioune' / 'SOUMBÉDIOUNE' / 'sumbejun' → 'Soumbédioune'
    - 'bargny' / 'BARGNI' → 'Bargny'
    - 'zone inconnue' → 'Zone inconnue' (fallback : capitalize)

    Utilisée À LA PUBLICATION pour garantir la cohérence en base.
    """
    if not zone or zone.strip().lower() == "non précisé":
        return zone

    zone_norm = _normaliser_texte(zone)

    # Cherche dans la table des variantes
    if zone_norm in _VARIANTES_ZONES:
        return _VARIANTES_ZONES[zone_norm]

    # Fallback : retourne avec une majuscule
    return zone.strip().title()