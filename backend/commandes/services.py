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
    """
    Calcule la distance à vol d'oiseau (en km) entre deux coordonnées GPS via la formule de Haversine.
    """
    # Conversion explicite en float au cas où des Decimal Django soient transmis
    lat1, lon1, lat2, lon2 = map(float, [lat1, lon1, lat2, lon2])

    R = 6371.0  # Rayon moyen de la Terre en kilomètres
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    # Correction de la formule de Haversine : 2 * atan2(√a, √(1-a))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return round(R * c, 2)


# def calculer_frais_livraison(distance_km: float) -> float:
#     """
#     Barème progressif des frais de livraison :
#     - 0 à 5 km   : 1 000 FCFA (tarif forfaitaire de base)
#     - 5 à 15 km  : 1 000 FCFA + 150 FCFA par km supplémentaire
#     - > 15 km    : 2 500 FCFA + 100 FCFA par km supplémentaire
#     """
#     distance_km = float(distance_km)

#     if distance_km <= 5:
#         return 1000.0
#     elif distance_km <= 15:
#         return 1000.0 + (distance_km - 5) * 150.0
#     else:
#         return 2500.0 + (distance_km - 15) * 100.0



def calculer_frais_livraison(distance_km: float) -> float:
    """
    Barème : 500 FCFA pour les 2 premiers km, puis 250 FCFA par km sup.
    Ex: 2 km → 500, 5 km → 1250, 10 km → 2500
    """
    distance_km = float(distance_km)
    if distance_km <= 2:
        return 500.0
    return round(500.0 + (distance_km - 2) * 250.0, 2)    


def envoyer_webhook_n8n(evenement: str, payload: dict) -> None:
    """
    Émet un webhook vers le serveur n8n.
    - evenement : identifiant du déclencheur (ex: 'produit.publie_alerte_premium', 'commande.confirmee')
    - payload   : données JSON associées
    """
    n8n_url = getattr(settings, "N8N_WEBHOOK_URL", None)
    if not n8n_url:
        logger.warning("N8N_WEBHOOK_URL non configuré dans settings.py")
        return

    body = {
        "event": evenement,
        "data": payload,
    }

    try:
        response = requests.post(n8n_url, json=body, timeout=4)
        response.raise_for_status()
    except requests.RequestException as exc:
        logger.error(f"Échec de l'envoi du webhook à n8n ({evenement}): {exc}")