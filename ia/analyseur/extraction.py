"""
analyseur/extraction.py

Extrait, depuis le WOLOF (priorité) et le FRANÇAIS (secours), les
informations nécessaires pour pré-remplir une publication :
espèce (-> nom + catégorie), quantité (kg), prix (FCFA).

Principe : pas besoin d'être parfait. Si une info manque, le score de
confiance baisse, et la publication part en modération admin
(Publication.regle_moderation côté Django).
"""

import re
import difflib

# ============================================================
# Dictionnaire d'espèces : WOLOF + FRANÇAIS -> (nom affiché, catégorie)
# ============================================================
ESPECES = {
    # --- Wolof (Kiriku les écrit correctement) ---
    "thiof":    ("Thiof",      "poisson"),
    "waxande":  ("Sole",       "poisson"),
    "sall":     ("Mulet",      "poisson"),
    "kelle":    ("Maquereau",  "poisson"),
    "yaboy":    ("Sardinelle", "poisson"),
    "cobo":     ("Capitaine",  "poisson"),
    "mbossé":   ("Courbine",   "poisson"),
    "safar":    ("Thon",       "poisson"),
    "jën":      ("Poisson",    "poisson"),
    "sokk":     ("Crevette",   "fruit_de_mer"),
    "yokkute":  ("Poulpe",     "fruit_de_mer"),
    "tank":     ("Crabe",      "fruit_de_mer"),
    "langust":  ("Langouste",  "fruit_de_mer"),
    "calmar":   ("Calmar",     "fruit_de_mer"),

    # --- Variantes phonétiques (au cas où) ---
    "tiof":     ("Thiof",      "poisson"),
    "tioff":    ("Thiof",      "poisson"),
    "waxandé":  ("Sole",       "poisson"),
    "sal":      ("Mulet",      "poisson"),
    "kel":      ("Maquereau",  "poisson"),
    "yabo":     ("Sardinelle", "poisson"),
    "kobo":     ("Capitaine",  "poisson"),
    "mbosse":   ("Courbine",   "poisson"),
    "sok":      ("Crevette",   "fruit_de_mer"),
    "yokute":   ("Poulpe",     "fruit_de_mer"),

    # --- Français (au cas où la traduction foire) ---
    "dorade":   ("Dorade",     "poisson"),
    "sole":     ("Sole",       "poisson"),
    "mulet":    ("Mulet",      "poisson"),
    "capitaine":("Capitaine",  "poisson"),
    "courbine": ("Courbine",   "poisson"),
    "sardinelle":("Sardinelle","poisson"),
    "maquereau":("Maquereau",  "poisson"),
    "thon":     ("Thon",       "poisson"),
    "crevette": ("Crevette",   "fruit_de_mer"),
    "crevettes":("Crevette",   "fruit_de_mer"),
    "poulpe":   ("Poulpe",     "fruit_de_mer"),
    "crabe":    ("Crabe",      "fruit_de_mer"),
    "huitre":   ("Huître",     "fruit_de_mer"),
    "huître":   ("Huître",     "fruit_de_mer"),
    "langouste":("Langouste",  "fruit_de_mer"),
}

SEUIL_RESSEMBLANCE = 0.75


# ============================================================
# RECHERCHE D'ESPÈCE
# ============================================================

def _chercher_dans_texte(texte: str):
    """
    2 passes :
    1) Exacte (sous-chaîne).
    2) Approximative (mot par mot, tolère les déformations).
    Retourne (nom, categorie, trouve, methode) ou (None, None, False, None).
    """
    texte_minuscule = texte.lower()
    mots_du_texte = re.findall(r"\w+", texte_minuscule)

    # Passe 1 : exacte
    for espece, (nom, categorie) in ESPECES.items():
        if espece in texte_minuscule:
            return nom, categorie, True, "exacte"

    # Passe 2 : approximative
    for mot in mots_du_texte:
        proches = difflib.get_close_matches(
            mot, ESPECES.keys(), n=1, cutoff=SEUIL_RESSEMBLANCE
        )
        if proches:
            espece_trouvee = proches[0]
            nom, categorie = ESPECES[espece_trouvee]
            return nom, categorie, True, "approximative"

    return None, None, False, None


def extraire_espece(texte_transcrit: str, texte_traduit: str):
    """
    Cherche dans le WOLOF d'abord, puis dans le FRANÇAIS.
    Retourne (nom, categorie, trouve, confiance).
    confiance : 1.0 (exacte), 0.6 (approximative), 0.0 (rien trouvé).
    """
    nom, categorie, trouve, methode = _chercher_dans_texte(texte_transcrit)
    if not trouve:
        nom, categorie, trouve, methode = _chercher_dans_texte(texte_traduit)

    if not trouve:
        return None, None, False, 0.0

    confiance = 1.0 if methode == "exacte" else 0.6
    return nom, categorie, True, confiance


# ============================================================
# REGEX PRIX / QUANTITÉ
# ============================================================

MOTIF_PRIX = re.compile(
    r"(\d[\d\s]{0,10}\d|\d)\s*(?:francs?|fcfa|f\b)",
    re.IGNORECASE,
)
MOTIF_NOMBRE_NU = re.compile(r"\b(\d{3,6})\b")
MOTIF_QUANTITE = re.compile(
    r"(\d+[.,]?\d*)\s*(?:kg|kilos?|kilogrammes?|kilo)\b",
    re.IGNORECASE,
)


def nettoyer_nombre(texte_nombre: str) -> float:
    """'2 500' ou '2,5' -> 2500.0 ou 2.5"""
    texte_nombre = texte_nombre.replace(" ", "").replace(",", ".")
    return float(texte_nombre)


def extraire_quantite(texte: str):
    """Retourne (quantite, trouve, position_span)."""
    m = MOTIF_QUANTITE.search(texte)
    if m:
        try:
            return nettoyer_nombre(m.group(1)), True, m.span()
        except ValueError:
            return None, False, None
    return None, False, None


def extraire_prix(texte: str, position_quantite=None):
    """
    1) Nombre + unité monétaire -> confiance 1.0
    2) Nombre nu (en excluant la position déjà prise par la quantité)
       -> confiance 0.6
    """
    m = MOTIF_PRIX.search(texte)
    if m:
        try:
            return nettoyer_nombre(m.group(1)), True, 1.0
        except ValueError:
            pass

    for m in MOTIF_NOMBRE_NU.finditer(texte):
        if position_quantite is not None and m.span() == position_quantite:
            continue
        try:
            return nettoyer_nombre(m.group(1)), True, 0.6
        except ValueError:
            continue

    return None, False, 0.0


# ============================================================
# ANALYSE GLOBALE
# ============================================================

def analyser_texte_produit(texte_transcrit: str, texte_traduit: str, score_clip: float):
    """
    Combine extraction (wolof prioritaire) + score CLIP en UN SEUL score final.
    """
    # 1) Espèce
    nom, categorie_texte, espece_trouvee, confiance_espece = extraire_espece(
        texte_transcrit, texte_traduit
    )

    # 2) Quantité — wolof d'abord
    quantite, quantite_trouvee, pos_q = extraire_quantite(texte_transcrit)
    if not quantite_trouvee:
        quantite, quantite_trouvee, pos_q = extraire_quantite(texte_traduit)

    # 3) Prix — wolof d'abord
    prix, prix_trouve, confiance_prix = extraire_prix(texte_transcrit, pos_q)
    if not prix_trouve:
        prix, prix_trouve, confiance_prix = extraire_prix(texte_traduit, pos_q)

    categorie_finale = categorie_texte

    poids = {
        "espece":   0.35,
        "prix":     0.25,
        "quantite": 0.20,
        "image":    0.20,
    }
    score = (
        poids["espece"]   * confiance_espece
        + poids["prix"]     * confiance_prix
        + poids["quantite"] * (1.0 if quantite_trouvee else 0.0)
        + poids["image"]    * score_clip
    )

    return {
        "nom": nom,
        "categorie": categorie_finale,
        "prix": prix,
        "quantite": quantite,
        "score_confiance": round(score, 2),
        "details": {
            "espece_trouvee":   espece_trouvee,
            "espece_confiance": confiance_espece,
            "prix_trouve":      prix_trouve,
            "prix_confiance":   confiance_prix,
            "quantite_trouvee": quantite_trouvee,
            "score_clip":       round(score_clip, 2),
        },
    }