"""
analyseur/extraction.py

Extrait, depuis le WOLOF (priorité) et le FRANÇAIS (secours), les
informations nécessaires pour pré-remplir une publication :
espèce (-> nom + catégorie), quantité (kg), prix (FCFA), zone de pêche.

Principe : pas besoin d'être parfait. Si une info manque, le score de
confiance baisse, et la publication part en modération admin
(Publication.regle_moderation côté Django).
"""

import re
import difflib
import unicodedata

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
    "thioxogn":("crabe","fruit_de_mer" ),

    # --- Variantes phonétiques ---
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
    "Karabe": ("crabe","fruit_de_mer" ),
    "thioxogn":("crabe","fruit_de_mer" ),

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
    "crabe":("Crabe", "fruit_de_mer")
}

SEUIL_RESSEMBLANCE = 0.75


# ============================================================
# ZONES DE PÊCHE DU SÉNÉGAL
# nom affiché -> variantes (noms wolof / orthographes que l'ASR peut produire)
# À COMPLÉTER avec ce que Kiriku écrit réellement (voir les logs [ASR]).
# Les accents, tirets et majuscules sont ignorés à la comparaison.
# ============================================================
ZONES = {
    "Saint-Louis": ["saint louis", "ndar", "sanlui", "san louis"],
    "Kayar": ["kayar", "kayaar"],
    "Fass Boye": ["fass boye", "fass boy", "fas boye"],
    "Mboro": ["mboro"],
    "Lompoul": ["lompoul"],
    "Yoff": ["yoff", "yoof"],
    "Ngor": ["ngor", "noor"],
    "Ouakam": ["ouakam", "wakam"],
    "Soumbédioune": ["soumbedioune", "sumbejun", "soumbejoune"],
    "Hann": ["hann"],
    "Thiaroye": ["thiaroye", "tiaroye", "caaroy"],
    "Mbao": ["mbao"],
    "Rufisque": ["rufisque", "rufisk", "ruufisk"],
    "Bargny": ["bargny", "bargni"],
    "Yène": ["yene"],
    "Toubab Dialaw": ["toubab dialaw", "tubab jalaw", "toubab dialao"],
    "Popenguine": ["popenguine", "popenguin"],
    "Guéréo": ["guereo", "guereo"],
    "Somone": ["somone"],
    "Ngaparou": ["ngaparou"],
    "Mbour": ["mbour", "mbuur"],
    "Nianing": ["nianing"],
    "Pointe-Sarène": ["pointe sarene", "point sarene", "sarene"],
    "Joal": ["joal", "jowaal", "joal fadiouth", "zool", "zool faajoot", "joal faajoot"],
    "Djiffer": ["djiffer", "jiffer"],
    "Dionewar": ["dionewar"],
    "Niodior": ["niodior"],
    "Foundiougne": ["foundiougne", "fundiyun"],
    "Missirah": ["missirah"],
    "Sokone": ["sokone"],
    "Toubacouta": ["toubacouta", "toubakouta"],
    "Kafountine": ["kafountine", "kafuntin"],
    "Diogué": ["diogue"],
    "Cap Skirring": ["cap skirring", "kap skiring", "cap skiring"],
    "Oussouye": ["oussouye"],
    "Elinkine": ["elinkine"],
    "Ziguinchor": ["ziguinchor", "sigicoor", "ziginchor"],
    "Goudomp": ["goudomp"],
    "Sédhiou": ["sedhiou", "sedhiou"],
    "Bignona": ["bignona"],
}

def _normaliser(texte):
    texte = texte.lower().replace("ŋ", "n")
    texte = unicodedata.normalize("NFKD", texte)
    texte = "".join(c for c in texte if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", " ", texte).strip()

# variante normalisée -> nom affiché
_VARIANTES = {}
for _canon, _alias in ZONES.items():
    for _v in [_canon] + _alias:
        _VARIANTES[_normaliser(_v)] = _canon

def _chercher_zone_dans(texte):
    """
    Passe 1 : le nom (ou un alias) apparaît comme MOT ENTIER -> 1.0
    Passe 2 : groupes de 1 à 3 mots consécutifs, tolérance aux fautes -> 0.6
    """
    if not texte or not texte.strip():
        return None
    norm = _normaliser(texte)
    if not norm:
        return None
    contexte = f" {norm} "
    for variante in sorted(_VARIANTES, key=len, reverse=True):
        if f" {variante} " in contexte:
            return _VARIANTES[variante], 1.0
    mots = norm.split()
    candidats = [v for v in _VARIANTES if len(v) >= 6]
    for taille in (3, 2, 1):
        for i in range(len(mots) - taille + 1):
            groupe = " ".join(mots[i:i + taille])
            if len(groupe) < 5:
                continue
            proches = difflib.get_close_matches(groupe, candidats, n=1, cutoff=0.82)
            if proches:
                return _VARIANTES[proches[0]], 0.6
    return None

def extraire_zone(texte_transcrit: str, texte_traduit: str):
    """
    Cherche une zone de pêche (wolof d'abord, puis français).
    Retourne (nom_zone, trouve, confiance) : 1.0 exacte, 0.6 approximative, 0.0 rien.
    """
    res = _chercher_zone_dans(texte_transcrit) or _chercher_zone_dans(texte_traduit)
    if not res:
        return None, False, 0.0
    return res[0], True, res[1]


# ============================================================
# RECHERCHE D'ESPÈCE
# ============================================================

# Clés d'espèces normalisées (sans accents) -> (nom, catégorie)
_ESPECES_NORM = {_normaliser(k): v for k, v in ESPECES.items()}
_GENERIQUES = {"Poisson"}  # "jën" = poisson en général : on préfère une espèce précise


def _mot_correspond(mot: str, cle: str) -> bool:
    """
    Le mot du texte correspond à la clé si c'est le même MOT
    (ou la clé + un petit suffixe wolof/pluriel : thiofi, crevettes...).
    Les clés courtes (sal, kel, sok...) ne matchent que le mot exact :
    sinon "sal" se retrouve dans "salaamaalekum" -> Mulet.
    """
    if mot == cle:
        return True
    return len(cle) >= 5 and mot.startswith(cle) and len(mot) <= len(cle) + 2


def _chercher_dans_texte(texte: str):
    """
    3 passes, toujours sur des MOTS ENTIERS (jamais des sous-chaînes) :
    1) Exacte sur une espèce précise.
    2) Approximative (déformations de l'ASR), mots de 4+ lettres seulement.
    3) Exacte sur le mot générique ("jën" / "poisson").
    """
    if not texte or not texte.strip():
        return None, None, False, None

    mots = _normaliser(texte).split()

    # Passe 1 : exacte, espèce précise
    for mot in mots:
        for cle, (nom, categorie) in _ESPECES_NORM.items():
            if nom not in _GENERIQUES and _mot_correspond(mot, cle):
                return nom, categorie, True, "exacte"

    # Passe 2 : approximative
    cles_longues = [c for c, (n, _) in _ESPECES_NORM.items()
                    if len(c) >= 4 and n not in _GENERIQUES]
    for mot in mots:
        if len(mot) < 4:
            continue
        proches = difflib.get_close_matches(
            mot, cles_longues, n=1, cutoff=SEUIL_RESSEMBLANCE
        )
        if proches:
            nom, categorie = _ESPECES_NORM[proches[0]]
            return nom, categorie, True, "approximative"

    # Passe 3 : mot générique
    for mot in mots:
        for cle, (nom, categorie) in _ESPECES_NORM.items():
            if nom in _GENERIQUES and _mot_correspond(mot, cle):
                return nom, categorie, True, "generique"

    return None, None, False, None


def extraire_espece(texte_transcrit: str, texte_traduit: str):
    """
    Cherche dans le WOLOF d'abord, puis dans le FRANÇAIS.
    Si le wolof ne donne qu'un mot générique ("jën"), on regarde aussi le
    français pour tenter de trouver une espèce précise.
    Retourne (nom, categorie, trouve, confiance).
    """
    nom, categorie, trouve, methode = _chercher_dans_texte(texte_transcrit)

    if not trouve:
        nom, categorie, trouve, methode = _chercher_dans_texte(texte_traduit)
    elif methode == "generique":
        n2, c2, t2, m2 = _chercher_dans_texte(texte_traduit)
        if t2 and m2 != "generique":
            nom, categorie, trouve, methode = n2, c2, t2, m2

    if not trouve:
        return None, None, False, 0.0

    confiance = {"exacte": 1.0, "approximative": 0.6, "generique": 0.5}[methode]
    return nom, categorie, True, confiance


# ============================================================
# REGEX PRIX / QUANTITÉ
# ============================================================

MOTIF_PRIX = re.compile(
    r"(\d[\d\s]{0,10}\d|\d)\s*(?:francs?|fcfa|f\b)",
    re.IGNORECASE,
)
MOTIF_NOMBRE_NU = re.compile(r"\b(\d{1,3}(?:\s\d{3})+|\d{3,6})\b")
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
    2) Nombre nu -> confiance 0.6
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

    # 4) Zone de pêche
    zone, zone_trouvee, confiance_zone = extraire_zone(
        texte_transcrit, texte_traduit
    )

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
        "adresse": zone,   # peut être None
        "score_confiance": round(score, 2),
        "details": {
            "espece_trouvee":   espece_trouvee,
            "espece_confiance": confiance_espece,
            "prix_trouve":      prix_trouve,
            "prix_confiance":   confiance_prix,
            "quantite_trouvee": quantite_trouvee,
            "zone_trouvee":     zone_trouvee,
            "zone_confiance":   confiance_zone,
            "score_clip":       round(score_clip, 2),
        },
    }