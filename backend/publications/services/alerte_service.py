"""
Service de matching alerte ↔ publication + envoi de notifications FCM.
"""
import logging
import unicodedata

from commandes.models import Alerte
from utilisateurs.models import FCMToken
from .services_fcm import envoyer_notification_fcm

logger = logging.getLogger(__name__)


def normaliser(texte):
    """Normalise : minuscules, sans accents, sans espaces superflus."""
    if not texte:
        return ""
    texte = unicodedata.normalize("NFKD", texte).encode("ascii", "ignore").decode()
    return texte.strip().lower()


def normaliser_singulier_pluriel(texte):
    """
    Normalise ET retire le 's' final pour comparer singulier/pluriel.
    Ex : "Crevettes" → "crevette", "Crevette" → "crevette"
    """
    t = normaliser(texte)
    if t.endswith("s") and len(t) > 3:
        return t[:-1]
    return t


def trouver_tokens_interesses(publication):
    """
    Retourne les tokens FCM des acheteurs dont une alerte ACTIVE correspond
    à cette publication (nom normalisé, zone vide = toutes zones).
    """
    nom_pub = normaliser_singulier_pluriel(publication.nom)
    zone_pub = normaliser(publication.adresse)

    print(
        f">>> [ALERTE] Matching pub #{publication.id} : "
        f"nom='{nom_pub}', zone='{zone_pub}'"
    )

    alertes = Alerte.objects.filter(
        statut=Alerte.Statut.ACTIVE,
        acheteur__isnull=False,
    ).select_related("acheteur")

    acheteurs_ids = set()

    for alerte in alertes:
        # Comparaison nom (singulier/pluriel toléré)
        if normaliser_singulier_pluriel(alerte.nom_poisson) != nom_pub:
            continue

        # Comparaison zone (vide = toutes zones)
        zone_alerte = normaliser(alerte.zone)
        if zone_alerte and zone_alerte != zone_pub:
            continue

        acheteurs_ids.add(alerte.acheteur_id)

    # Récupère les tokens FCM
    tokens = list(
        FCMToken.objects
        .filter(utilisateur_id__in=acheteurs_ids)
        .values_list("token", flat=True)
        .distinct()
    )

    print(
        f">>> [ALERTE] {len(acheteurs_ids)} acheteurs ciblés, "
        f"{len(tokens)} tokens"
    )
    return tokens


def notifier_publication(publication):
    """
    Envoie un push FCM aux acheteurs dont l'alerte correspond.
    Compatible avec tout modèle Produit (utilise getattr pour les champs optionnels).
    """
    tokens = trouver_tokens_interesses(publication)

    if not tokens:
        print(">>> [ALERTE] Aucun acheteur à notifier")
        return {"success": 0, "failure": 0, "unregistered": []}

    titre = f" {publication.nom} disponible !"

    #  getattr : ne plante PAS si le champ n'existe pas
    zone_txt = getattr(publication, "adresse", None) or "Dakar"
    prix_val = getattr(publication, "prix", 0) or 0
    unite_val = getattr(publication, "unite", None) or "kg"

    prix_txt = f"{prix_val} FCFA/{unite_val}"
    corps = f"{zone_txt} · {prix_txt}"

    data = {
        "type": "nouvelle_publication",
        "publication_id": str(publication.id),
        "nom_produit": str(publication.nom),
        "zone": str(zone_txt),
        "prix": str(prix_val),
        "url": f"/acheteur/produit/{publication.id}",
    }

    result = envoyer_notification_fcm(tokens, titre, corps, data)

    if result.get("unregistered"):
        FCMToken.objects.filter(token__in=result["unregistered"]).delete()
        print(
            f">>> [ALERTE] {len(result['unregistered'])} tokens invalides supprimés"
        )

    return result