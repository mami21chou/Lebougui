"""
App : publications
Fichier : ia_service.py

Isole tout ce qui parle au microservice IA (FastAPI + Hugging Face), pour
que les vues n'aient pas à connaître les détails de cet appel réseau.
"""

import requests
from django.conf import settings


class ErreurAnalyseIA(Exception):
    """Levée si le microservice IA est injoignable ou renvoie une erreur."""
    pass


def analyser_media(audio_file, media_file=None):
    """
    Envoie l'audio (+ la photo/vidéo si fournie) au microservice FastAPI, et
    renvoie son analyse SANS RIEN ENREGISTRER en base (voir étape 1/2).

    media_file est FACULTATIF : un pêcheur qui signale une zone de pêche
    n'envoie qu'un vocal, sans photo. C'est justement à l'IA de déterminer,
    à partir de l'audio (et de la photo si elle existe), s'il s'agit d'un
    Produit ou d'une Information.

    Retourne un dictionnaire, par exemple :
    {
        "type": "produit",              # ou "information"
        "texte_transcrit": "...",       # sortie du modèle de transcription
        "texte_traduit": "...",         # sortie du modèle de traduction
        "score_confiance": 0.82,        # entre 0 et 1
        "suggestion": {                 # proposition à pré-remplir côté React
            "nom": "Thiof",
            "categorie": "poisson",
            "description": "...",       # utile seulement si type=information
        },
    }
    """
    url = f"{settings.IA_SERVICE_URL}/analyser"

    fichiers = {
        "audio": (audio_file.name, audio_file, audio_file.content_type),
    }
    if media_file is not None:
        fichiers["media"] = (media_file.name, media_file, media_file.content_type)
    # Si media_file est None, on n'ajoute PAS la clé "media" du tout au lieu
    # d'envoyer une valeur vide : côté FastAPI, il suffira de vérifier
    # `if "media" in request.files` pour savoir si une photo a été fournie.

    try:
        reponse = requests.post(url, files=fichiers)
        reponse.raise_for_status()
    except requests.RequestException as erreur:
        raise ErreurAnalyseIA(f"Le service IA est injoignable : {erreur}")

    return reponse.json()