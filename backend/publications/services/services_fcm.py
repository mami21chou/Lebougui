"""
Envoi des notifications push via Firebase Cloud Messaging (FCM v1).
"""
import os
import logging

import firebase_admin
from firebase_admin import credentials, messaging
from django.conf import settings

logger = logging.getLogger(__name__)

# ═══ Initialisation unique ═══
if not firebase_admin._apps:
    chemin_cle = os.path.join(settings.BASE_DIR, "firebase_key.json")
    cred = credentials.Certificate(chemin_cle)
    firebase_admin.initialize_app(cred)
    logger.info(">>> [FCM] Firebase Admin initialisé ")


def _construire_webpush_config(titre, corps, data_str):
    """
    Construit la config webpush. Le champ 'link' n'est ajouté
    QUE si l'URL est en HTTPS (Firebase le refuse sinon).
    """
    # Construit la notification webpush
    notification = messaging.WebpushNotification(
        title=titre,
        body=corps,
        icon="/images/logo-lebougui.jpeg",
        badge="/images/logo-lebougui.jpeg",
        data=data_str,
    )

    # Récupère le lien éventuel
    url = data_str.get("url", "")

    #  N'ajoute fcm_options QUE si l'URL est HTTPS
    if url.startswith("https://"):
        fcm_options = messaging.WebpushFCMOptions(link=url)
        return messaging.WebpushConfig(
            notification=notification,
            fcm_options=fcm_options,
        )
    else:
        # Pas de lien → FCM ne râle pas
        return messaging.WebpushConfig(notification=notification)


def envoyer_notification_fcm(tokens: list, titre: str, corps: str, data: dict = None):
    """
    Envoie une notification push à une liste de tokens FCM.
    """
    if not tokens:
        return {"success": 0, "failure": 0, "unregistered": []}

    #  FCM exige que les valeurs de "data" soient des strings
    data_str = {str(k): str(v) for k, v in (data or {}).items()}

    message = messaging.MulticastMessage(
        notification=messaging.Notification(title=titre, body=corps),
        data=data_str,
        tokens=tokens,
        webpush=_construire_webpush_config(titre, corps, data_str),
    )

    try:
        response = messaging.send_each_for_multicast(message)

        unregistered = []
        for idx, resp in enumerate(response.responses):
            if not resp.success and isinstance(resp.exception, messaging.UnregisteredError):
                unregistered.append(tokens[idx])

        print(
            f">>> [FCM] {response.success_count} succès, "
            f"{response.failure_count} échecs, "
            f"{len(unregistered)} tokens invalides"
        )
        return {
            "success": response.success_count,
            "failure": response.failure_count,
            "unregistered": unregistered,
        }
    except Exception as e:
        print(f">>> [FCM] Erreur : {e}")
        return {"success": 0, "failure": len(tokens), "unregistered": []}