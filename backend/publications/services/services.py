"""
App : publications
Fichier : services.py
Rôle : Géocodage des adresses (Nominatim) pour obtenir les coordonnées GPS.
"""

import requests
from functools import lru_cache


@lru_cache(maxsize=200)
def geocoder_adresse(adresse: str):
    """
    Convertit une adresse en coordonnées GPS via Nominatim (OpenStreetMap).
    Retourne (latitude, longitude) ou (None, None) si échec.
    """
    if not adresse or adresse.lower().strip() in (
        "non précisé", "non precise", "non précisée", ""
    ):
        return None, None

    try:
        r = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": f"{adresse}, Sénégal", "format": "json", "limit": 1},
            headers={"User-Agent": "Lebougui/1.0"},
            timeout=5,
        )
        data = r.json()
        if data:
            lat = float(data[0]["lat"])
            lng = float(data[0]["lon"])
            print(f">>> [GEOCODAGE] {adresse} → ({lat}, {lng})")
            return lat, lng
    except Exception as e:
        print(f">>> [GEOCODAGE] Échec pour '{adresse}': {e}")

    return None, None