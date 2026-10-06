"""
App : commandes
Fichier : services.py
Rôle : Calcul des frais de livraison et intégration avec les webhooks n8n.
"""

import math
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)


def calculer_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calcule la distance à vol d'oiseau (en km) via la formule de Haversine."""
    lat1, lon1, lat2, lon2 = map(float, [lat1, lon1, lat2, lon2])

    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return round(R * c, 2)


def calculer_frais_livraison(distance_km: float, nb_commandes: int = 1) -> float:
    """
    Barème progressif des frais de livraison.

    Distance → Tarif de base :
    - 0 à 3 km    : 500 FCFA
    - 3 à 7 km    : 500 + 150/km supplémentaire
    - 7 à 15 km   : 1 100 + 200/km supplémentaire
    - > 15 km     : 2 700 + 250/km supplémentaire

    Bonus de regroupement :
    - Chaque commande supplémentaire : +30% du tarif de base
    """
    distance_km = float(distance_km)

    if distance_km <= 3:
        base = 500.0
    elif distance_km <= 7:
        base = 500.0 + (distance_km - 3) * 150.0
    elif distance_km <= 15:
        base = 1100.0 + (distance_km - 7) * 200.0
    else:
        base = 2700.0 + (distance_km - 15) * 250.0

    # Bonus de regroupement
    if nb_commandes > 1:
        base += base * 0.3 * (nb_commandes - 1)

    return round(base, 2)


def envoyer_webhook_n8n(evenement: str, payload: dict) -> None:
    """Émet un webhook vers le serveur n8n."""
    n8n_url = getattr(settings, "N8N_WEBHOOK_URL", None)
    if not n8n_url:
        logger.warning("N8N_WEBHOOK_URL non configuré dans settings.py")
        return

    body = {"event": evenement, "data": payload}

    try:
        response = requests.post(n8n_url, json=body, timeout=4)
        response.raise_for_status()
    except requests.RequestException as exc:
        logger.error(f"Échec de l'envoi du webhook à n8n ({evenement}): {exc}")