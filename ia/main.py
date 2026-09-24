from fastapi import FastAPI, UploadFile, File, HTTPException
from typing import Optional
import os
import tempfile
import subprocess

from analyseur.models import transcrire_audio, traduire_texte, classifier_image
from analyseur.extraction import analyser_texte_produit, extraire_zone

app = FastAPI(title="Lebougui - Microservice IA")

SEUIL_CONFIANCE = 0.70


def convertir_en_wav(audio_bytes: bytes, suffixe_entree: str = ".webm") -> bytes:
    """Convertit n'importe quel format audio en WAV mono 16 kHz via ffmpeg."""
    with tempfile.NamedTemporaryFile(suffix=suffixe_entree, delete=False) as f_in:
        f_in.write(audio_bytes)
        chemin_in = f_in.name

    chemin_out = chemin_in + ".wav"

    try:
        subprocess.run(
            [
                "ffmpeg", "-y",
                "-i", chemin_in,
                "-ac", "1",
                "-ar", "16000",
                "-f", "wav",
                chemin_out,
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
        )
        with open(chemin_out, "rb") as f_out:
            return f_out.read()
    except subprocess.CalledProcessError as e:
        err = e.stderr.decode(errors="ignore") if e.stderr else "pas de stderr"
        print(">>> ffmpeg stderr =", err[-500:])
        raise HTTPException(status_code=400, detail=f"ffmpeg a échoué : {err[-300:]}")
    finally:
        for chemin in (chemin_in, chemin_out):
            if os.path.exists(chemin):
                os.remove(chemin)


@app.post("/analyser")
async def analyser(audio: UploadFile = File(...), media: Optional[UploadFile] = File(None)):
    # ---------- 1. Lecture + conversion audio ----------
    audio_bytes = await audio.read()
    suffixe = os.path.splitext(audio.filename or ".webm")[1] or ".webm"

    print("=" * 60)
    print(f">>> [REÇU] filename={audio.filename} size={len(audio_bytes)} suffixe={suffixe}")

    try:
        audio_wav_bytes = convertir_en_wav(audio_bytes, suffixe_entree=suffixe)
    except Exception as e:
        print(">>> [ERREUR] conversion :", repr(e))
        raise HTTPException(status_code=400, detail=f"Conversion échouée : {e}")

    # ---------- 2. Transcription (Kiriku) + traduction ----------
    texte_transcrit = transcrire_audio(audio_wav_bytes)
    texte_traduit = traduire_texte(texte_transcrit)

    print("=" * 60)
    print(">>> [RÉSULTAT IA]")
    print(f">>>   wolof    : {texte_transcrit}")
    print(f">>>   français : {texte_traduit}")
    print("=" * 60)

    # ---------- 3. Cas PRODUIT (photo fournie) ----------
    if media is not None:
        media_bytes = await media.read()
        _categorie_image, score_clip = classifier_image(media_bytes)
        analyse = analyser_texte_produit(texte_transcrit, texte_traduit, score_clip)

        score_final = analyse["score_confiance"]
        statut_auto = "visible" if score_final >= SEUIL_CONFIANCE else "en_attente"

        print(">>> [SCORE] Détails du calcul :")
        print(f">>>   espece_trouvee   = {analyse['details']['espece_trouvee']}")
        print(f">>>   espece_confiance = {analyse['details']['espece_confiance']}")
        print(f">>>   prix_trouve      = {analyse['details']['prix_trouve']}")
        print(f">>>   prix_confiance   = {analyse['details']['prix_confiance']}")
        print(f">>>   quantite_trouvee = {analyse['details']['quantite_trouvee']}")
        print(f">>>   zone_trouvee     = {analyse['details']['zone_trouvee']}")
        print(f">>>   zone_confiance   = {analyse['details']['zone_confiance']}")
        print(f">>>   score_clip       = {analyse['details']['score_clip']}")
        print(f">>>   SCORE FINAL      = {score_final}")
        print(f">>>   SEUIL            = {SEUIL_CONFIANCE}")
        print(f">>>   → {statut_auto.upper()}")
        print("=" * 60)

        return {
            "type": "produit",
            "texte_transcrit": texte_transcrit,
            "texte_traduit": texte_traduit,
            "score_confiance": score_final,
            "statut_auto": statut_auto,
            "suggestion": {
                "nom":       analyse["nom"],
                "categorie": analyse["categorie"],
                "prix":      analyse["prix"],
                "quantite":  analyse["quantite"],
                "adresse":   analyse.get("adresse"),   #  AJOUTÉ
            },
            "details": analyse["details"],
        }

    # ---------- 4. Cas INFORMATION (sans photo) ----------
    zone, _zone_trouvee, _zone_confiance = extraire_zone(texte_transcrit, texte_traduit)

    score_confiance = 1.0 if len(texte_traduit.strip()) >= 5 else 0.3
    statut_auto = "visible" if score_confiance >= SEUIL_CONFIANCE else "en_attente"

    print(f">>> [INFO] score = {score_confiance} → {statut_auto.upper()}")
    print(f">>> [INFO] zone  = {zone}")
    print("=" * 60)

    return {
        "type": "information",
        "texte_transcrit": texte_transcrit,
        "texte_traduit": texte_traduit,
        "score_confiance": score_confiance,
        "statut_auto": statut_auto,
        "suggestion": {
            "description": texte_traduit,
            "adresse":     zone,   #  AJOUTÉ
        },
    }