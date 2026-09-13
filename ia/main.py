"""
Microservice IA — main.py

Expose UN SEUL endpoint, POST /analyser, appelé par le backend Django
(publications/ia_service.py). Ne touche JAMAIS à la base de données —
son seul travail est de recevoir audio (+photo optionnelle) et de
renvoyer une analyse.
"""

from fastapi import FastAPI, UploadFile, File
from typing import Optional
from analyseur.models import transcrire_audio, traduire_texte, classifier_image
from analyseur.extraction import analyser_texte_produit

app = FastAPI(title="Lebougui - Microservice IA")


@app.post("/analyser")
async def analyser(audio: UploadFile = File(...), media: Optional[UploadFile] = File(None)):
    """
    audio : toujours fourni (le pêcheur publie toujours par vocal).
    media : facultatif — présent seulement si le pêcheur a aussi pris une
            photo (cas d'une prise à vendre).

    Règle de décision Produit vs Information : présence d'une photo.
    """
    audio_bytes = await audio.read()

    # Étapes 1 et 2 : transcription puis traduction (communes aux deux cas).
    texte_transcrit = transcrire_audio(audio_bytes)
    texte_traduit = traduire_texte(texte_transcrit)

    if media is not None:
        # ----- Cas PRODUIT -----
        media_bytes = await media.read()
        _categorie_image, score_clip = classifier_image(media_bytes)

        analyse = analyser_texte_produit(texte_transcrit, texte_traduit, score_clip)

        return {
            "type": "produit",
            "texte_transcrit": texte_transcrit,
            "texte_traduit": texte_traduit,
            "score_confiance": analyse["score_confiance"],
            "suggestion": {
                "nom": analyse["nom"],
                "categorie": analyse["categorie"],
                "prix": analyse["prix"],
                "quantite": analyse["quantite"],
            },
            "details": analyse["details"],  # utile à l'Admin si score bas
        }

    else:
        # ----- Cas INFORMATION -----
        # Pas de photo : pas besoin d'extraction complexe, le texte traduit
        # devient directement la description. On considère la confiance
        # comme correspondant à la simple présence d'un texte exploitable
        # (une transcription vide/trop courte indique un souci d'audio).
        score_confiance = 1.0 if len(texte_traduit.strip()) >= 5 else 0.3

        return {
            "type": "information",
            "texte_transcrit": texte_transcrit,
            "texte_traduit": texte_traduit,
            "score_confiance": score_confiance,
            "suggestion": {
                "description": texte_traduit,
            },
        }