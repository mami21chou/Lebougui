import io
import time
import torch
from PIL import Image
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer, pipeline

# Maximise l'utilisation des cœurs CPU de la machine
torch.set_num_threads(4)

# ============================================================
# 1. TRANSCRIPTION (Transformers ASR avec configuration rapide)
# ============================================================
transcripteur = pipeline(
    "automatic-speech-recognition",
    model="AIHubSN/Kiriku-Wolof-ASR",
    torch_dtype=torch.float32,
)

# ============================================================
# 2. TRADUCTION (NLLB Inférence rapide)
# ============================================================
MODELE_TRADUCTION = "galsenai/wolofToFrenchTranslator_nllb"

tokenizer_traduction = AutoTokenizer.from_pretrained(MODELE_TRADUCTION)
modele_traduction = AutoModelForSeq2SeqLM.from_pretrained(
    MODELE_TRADUCTION,
    low_cpu_mem_usage=True,
    torch_dtype=torch.float32,
)

# ============================================================
# 3. CLASSIFICATION D'IMAGE
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
    """Transcrit le fichier audio en texte wolof."""
    debut = time.time()

    # Inférence rapide : num_beams=1 pour accélérer x4 la transcription
    resultat = transcripteur(
        fichier_audio_bytes,
        generate_kwargs={
            "num_beams": 1,
            "do_sample": False,
        },
    )

    fin = time.time()
    print("Temps transcription :", round(fin - debut, 2), "secondes")

    return resultat["text"]


def traduire_texte(texte_wolof: str) -> str:
    """Traduit un texte wolof en français."""
    if not texte_wolof.strip():
        return ""

    debut = time.time()

    tokenizer_traduction.src_lang = "wol_Latn"

    inputs = tokenizer_traduction(
        texte_wolof, return_tensors="pt", truncation=True, max_length=128
    )

    outputs = modele_traduction.generate(
        **inputs,
        forced_bos_token_id=256057,
        max_new_tokens=60,
        num_beams=1,
        do_sample=False,
    )

    texte_francais = tokenizer_traduction.decode(
        outputs[0], skip_special_tokens=True
    )

    fin = time.time()
    print("Temps traduction :", round(fin - debut, 2), "secondes")

    return texte_francais


def classifier_image(fichier_image_bytes: bytes):
    """Renvoie (categorie, score) à partir des octets bruts de l'image."""
    image = Image.open(io.BytesIO(fichier_image_bytes))

    resultat = classifieur_image(image, candidate_labels=CATEGORIES_IMAGE)

    meilleure = resultat[0]
    categorie = (
        "fruit_de_mer" if meilleure["label"] == "fruit de mer" else "poisson"
    )

    return categorie, meilleure["score"]