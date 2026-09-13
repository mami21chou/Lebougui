"""
Microservice IA — extraction.py

Cherche, dans le texte français déjà traduit, les informations nécessaires
pour remplir une publication SANS que le pêcheur ait à corriger quoi que
ce soit : l'espèce (-> nom + catégorie), le prix, et la quantité.

Principe : on ne cherche pas à être parfait ici. Si une info manque, le
score de confiance baisse, et la publication part en modération admin
automatiquement (voir Publication.regle_moderation côté Django) — le
pêcheur n'a jamais à se rendre compte qu'une info a été mal comprise.
"""

import re
import difflib

# Dictionnaire d'espèces courantes au Sénégal -> catégorie.
# À enrichir au fil des tests réels avec de vrais pêcheurs.
ESPECES = {
    "thiof": "poisson",
    "dorade": "poisson",
    "capitaine": "poisson",
    "sole": "poisson",
    "mulet": "poisson",
    "courbine": "poisson",
    "sardinelle": "poisson",
    "maquereau": "poisson",
    "thon": "poisson",
    "crevette": "fruit_de_mer",
    "crevettes": "fruit_de_mer",
    "crevet": "fruit_de_mer",  # emprunt direct au français, courant à l'oral
    "poulpe": "fruit_de_mer",
    "crabe": "fruit_de_mer",
    "huitre": "fruit_de_mer",
    "huître": "fruit_de_mer",
    "langouste": "fruit_de_mer",
    "calmar": "fruit_de_mer",
}

SEUIL_RESSEMBLANCE = 0.75  # entre 0 et 1 : 0.75 tolère de petites déformations


def _chercher_dans_texte(texte: str):
    """
    Cherche une espèce dans un texte donné, en 2 passes :
    1) correspondance EXACTE (mot présent tel quel) — la plus fiable.
    2) correspondance APPROXIMATIVE (tolère une légère déformation du mot,
       due à une transcription ou une traduction imparfaite).
    Retourne (nom, categorie, trouve, methode) ou (None, None, False, None).
    """
    texte_minuscule = texte.lower()
    mots_du_texte = re.findall(r"\w+", texte_minuscule)

    # Passe 1 : correspondance exacte (sous-chaîne, comme avant)
    for espece, categorie in ESPECES.items():
        if espece in texte_minuscule:
            return espece.capitalize(), categorie, True, "exacte"

    # Passe 2 : correspondance approximative, mot par mot
    for mot in mots_du_texte:
        proches = difflib.get_close_matches(
            mot, ESPECES.keys(), n=1, cutoff=SEUIL_RESSEMBLANCE
        )
        if proches:
            espece_trouvee = proches[0]
            return espece_trouvee.capitalize(), ESPECES[espece_trouvee], True, "approximative"

    return None, None, False, None


def extraire_espece(texte_transcrit: str, texte_traduit: str):
    """
    Cherche une espèce connue, en donnant la PRIORITÉ au texte transcrit
    (souvent plus fiable pour les noms d'espèces, empruntés au français et
    parfois abîmés par la traduction plutôt que par la transcription).
    Si rien n'est trouvé dedans, on retente sur le texte traduit.

    Retourne (nom, categorie, trouve, confiance_espece).
    confiance_espece vaut : 1.0 (exacte), 0.6 (approximative), 0.0 (rien trouvé).
    """
    nom, categorie, trouve, methode = _chercher_dans_texte(texte_transcrit)
    if not trouve:
        nom, categorie, trouve, methode = _chercher_dans_texte(texte_traduit)

    if not trouve:
        return None, None, False, 0.0

    confiance = 1.0 if methode == "exacte" else 0.6
    return nom, categorie, True, confiance

# Regex : un nombre (avec ou sans espace/virgule) suivi d'une unité monétaire.
# Exemples valides : "2500 francs", "2500F", "2 500 FCFA", "2500 fcfa"
MOTIF_PRIX = re.compile(
    r"(\d[\d\s]{0,10}\d|\d)\s*(?:francs?|fcfa|f\b)", re.IGNORECASE
)

# Repli : un nombre "nu", sans unité — très courant à l'oral au Sénégal où
# "francs"/"FCFA" est souvent omis (ex: "je le vends à 2000").
# On exige au moins 3 chiffres, car les prix du poisson/fruits de mer se
# comptent rarement en dizaines — ça évite de confondre avec une quantité
# ("3 kilos") ou un numéro de téléphone tronqué.
MOTIF_NOMBRE_NU = re.compile(r"\b(\d{3,6})\b")

# Regex : un nombre suivi d'une unité de poids.
# Exemples valides : "3 kilos", "3kg", "2.5 kg", "2,5 kilogrammes"
MOTIF_QUANTITE = re.compile(
    r"(\d+[.,]?\d*)\s*(?:kg|kilos?|kilogrammes?)", re.IGNORECASE
)


def nettoyer_nombre(texte_nombre: str) -> float:
    """Convertit '2 500' ou '2,5' en float utilisable (2500.0 ou 2.5)."""
    texte_nombre = texte_nombre.replace(" ", "").replace(",", ".")
    return float(texte_nombre)


def extraire_quantite(texte_traduit: str):
    """Retourne (quantite: float|None, trouve: bool, position: int|None).
    position = où le nombre a été trouvé dans le texte, pour pouvoir
    l'exclure ensuite de la recherche de prix (voir extraire_prix)."""
    correspondance = MOTIF_QUANTITE.search(texte_traduit)
    if correspondance:
        try:
            return nettoyer_nombre(correspondance.group(1)), True, correspondance.span()
        except ValueError:
            return None, False, None
    return None, False, None


def extraire_prix(texte_traduit: str, position_quantite=None):
    """
    Retourne (prix: float|None, trouve: bool, confiance: float).

    Deux stratégies, dans l'ordre :
    1) Nombre suivi d'une unité monétaire explicite ("2500 francs") -> confiance 1.0.
    2) Repli : un nombre "nu" de 3 à 6 chiffres ailleurs dans le texte,
       fréquent à l'oral quand "francs" est sous-entendu -> confiance 0.6.
       On exclut le nombre déjà identifié comme quantité (position_quantite),
       pour ne pas réutiliser le même chiffre pour les deux champs.
    """
    correspondance = MOTIF_PRIX.search(texte_traduit)
    if correspondance:
        try:
            return nettoyer_nombre(correspondance.group(1)), True, 1.0
        except ValueError:
            pass

    # Repli : chercher un nombre nu, en ignorant celui déjà pris par la quantité
    for correspondance in MOTIF_NOMBRE_NU.finditer(texte_traduit):
        if position_quantite is not None and correspondance.span() == position_quantite:
            continue  # c'est le même nombre que la quantité, on ne le réutilise pas
        try:
            return nettoyer_nombre(correspondance.group(1)), True, 0.6
        except ValueError:
            continue

    return None, False, 0.0


def analyser_texte_produit(texte_transcrit: str, texte_traduit: str, score_clip: float):
    """
    Combine l'extraction texte + le score CLIP (image) en UN SEUL score de
    confiance final, et construit la suggestion complète à publier.

    Pondération choisie : chaque élément manquant fait chuter le score de
    manière significative, car l'objectif est justement qu'un score élevé
    signifie "tout a été compris, rien à faire vérifier par le pêcheur".
    """
    nom, categorie_texte, espece_trouvee, confiance_espece = extraire_espece(
        texte_transcrit, texte_traduit
    )
    # Quantité extraite EN PREMIER, pour pouvoir exclure sa position lors
    # de la recherche du prix (éviter de reprendre le même nombre 2 fois).
    quantite, quantite_trouvee, position_quantite = extraire_quantite(texte_traduit)
    prix, prix_trouve, confiance_prix = extraire_prix(texte_traduit, position_quantite)

    categorie_finale = categorie_texte  # priorité au texte (plus fiable que l'image seule)

    poids = {
        "espece": 0.35,
        "prix": 0.25,
        "quantite": 0.20,
        "image": 0.20,
    }
    score = (
        poids["espece"] * confiance_espece
        + poids["prix"] * confiance_prix
        + poids["quantite"] * (1.0 if quantite_trouvee else 0.0)
        + poids["image"] * score_clip
    )

    return {
        "nom": nom,
        "categorie": categorie_finale,
        "prix": prix,
        "quantite": quantite,
        "score_confiance": round(score, 2),
        "details": {
            "espece_trouvee": espece_trouvee,
            "espece_confiance": confiance_espece,
            "prix_trouve": prix_trouve,
            "prix_confiance": confiance_prix,  # 1.0 = unité explicite, 0.6 = déduit
            "quantite_trouvee": quantite_trouvee,
        },
    }