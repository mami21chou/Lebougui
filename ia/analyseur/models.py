"""
analyseur/models.py
Transcription (Kiriku-Wolof-ASR), traduction (Google Translate via deep-translator),
classification d'image (CLIP).
"""
import requests  
import io
import time
import torch
from PIL import Image
from transformers import pipeline, AutoModelForSeq2SeqLM, AutoTokenizer

torch.set_num_threads(4)

# ============================================================
# 1. TRANSCRIPTION — Kiriku Wolof ASR
# ============================================================
transcripteur = pipeline(
    "automatic-speech-recognition",
    model="AIHubSN/Kiriku-Wolof-ASR",
    torch_dtype=torch.float32,
)

# ============================================================
# 2. TRADUCTION — Google Translate (détection auto de la langue)
# ============================================================
# Note : Google Translate ne supporte pas "wo" comme source explicite
# via deep-translator, mais la détection auto reconnaît bien le wolof.
# On instancie donc le traducteur à chaque appel (voir traduire_texte).

# ============================================================
# 3. CLASSIFICATION D'IMAGE — CLIP
# ============================================================
classifieur_image = pipeline(
    "zero-shot-image-classification",
    model="openai/clip-vit-large-patch14",
)
CATEGORIES_IMAGE = ["poisson", "fruit de mer"]


# ============================================================
# FONCTIONS
# ============================================================

def transcrire_audio(fichier_audio_bytes: bytes) -> str:
    """Transcrit un WAV mono 16 kHz en texte wolof avec Kiriku."""
    debut = time.time()

    resultat = transcripteur(
        fichier_audio_bytes,
        generate_kwargs={"num_beams": 1, "do_sample": False},
    )
    texte = resultat["text"].strip()

    print(f">>> [ASR] texte = {texte!r}")
    print(f">>> [ASR] temps = {round(time.time() - debut, 2)}s")
    return texte




def traduire_texte(texte_wolof: str) -> str:
    """Traduit un texte wolof en français via MyMemory (pas de rate limit)."""
    if not texte_wolof.strip():
        return ""
    debut = time.time()

    # 1) Tentative MyMemory (wolof -> français explicite)
    try:
        r = requests.get(
            "https://api.mymemory.translated.net/get",
            params={"q": texte_wolof, "langpair": "wo|fr"},
            timeout=10,
        )
        r.raise_for_status()
        data = r.json()
        texte_fr = data.get("responseData", {}).get("translatedText", "").strip()
        # MyMemory renvoie parfois le texte source si rien trouvé :
        if texte_fr and texte_fr.lower() != texte_wolof.lower():
            print(f">>> [TRAD] fr = {texte_fr!r}")
            print(f">>> [TRAD] temps = {round(time.time() - debut, 2)}s")
            return texte_fr
    except Exception as e:
        print(">>> [TRAD] MyMemory KO :", e)

    # 2) Fallback : Google Translate (peut être rate-limited)
    try:
        r = requests.get(
            "https://translate.googleapis.com/translate_a/single",
            params={"client": "gtx", "sl": "auto", "tl": "fr", "dt": "t", "q": texte_wolof},
            timeout=10,
        )
        r.raise_for_status()
        data = r.json()
        texte_fr = "".join(seg[0] for seg in data[0] if seg[0])
        if texte_fr:
            print(f">>> [TRAD] fr (Google) = {texte_fr!r}")
            print(f">>> [TRAD] temps = {round(time.time() - debut, 2)}s")
            return texte_fr
    except Exception as e:
        print(">>> [TRAD] Google KO :", e)

    # 3) Rien ne marche : on renvoie le wolof brut
    print(f">>> [TRAD] aucun service dispo, on garde le wolof")
    return texte_wolof


def classifier_image(fichier_image_bytes: bytes):
    """Renvoie (categorie, score) à partir des octets bruts de l'image."""
    image = Image.open(io.BytesIO(fichier_image_bytes))
    resultat = classifieur_image(image, candidate_labels=CATEGORIES_IMAGE)
    meilleure = resultat[0]
    categorie = "fruit_de_mer" if meilleure["label"] == "fruit de mer" else "poisson"
    print(f">>> [CLIP] {meilleure['label']} ({meilleure['score']:.2f})")
    return categorie, meilleure["score"]