"""
App : publications
Fichier : views.py
"""
from .services.services import geocoder_adresse  
from django.shortcuts import get_object_or_404
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from django.db.models import Q
from .models import Produit, Information
from .serializers import (
    AnalyseSerializer, ProduitCreateSerializer, InformationCreateSerializer,
    ProduitSerializer, InformationSerializer,
)
from .services.service_ia import analyser_media, ErreurAnalyseIA
from utilisateurs.models import Utilisateur, Premium

# Imports pour la gestion des alertes Premium et du webhook n8n
from commandes.models import Alerte
from .services.services_fcm import envoyer_notification_fcm
from utilisateurs.models import FCMToken

class EstPecheur(permissions.BasePermission):
    """
    Permission personnalisée : autorise l'accès uniquement si l'utilisateur
    connecté a le rôle Pêcheur. IsAuthenticated ne suffit pas ici, puisqu'un
    Acheteur ou un Livreur connecté ne doit pas pouvoir publier une prise.
    """
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == Utilisateur.Role.PECHEUR
        )


# class AnalyserPublicationView(APIView):
#     """
#     ÉTAPE 1 : reçoit audio + média, interroge l'IA, renvoie une suggestion.
#     NE SAUVEGARDE RIEN en base — c'est un aperçu que le pêcheur pourra
#     corriger avant de confirmer (étape 2).
#     """
#     permission_classes = [EstPecheur]

#     def post(self, request):
#         serializer = AnalyseSerializer(data=request.data)
#         serializer.is_valid(raise_exception=True)

#         try:
#             resultat = analyser_media(
#                 serializer.validated_data["audio"],
#                 serializer.validated_data.get("media"),  # None si non fourni
#             )
#         except ErreurAnalyseIA as erreur:
#             # 503 = "Service indisponible" : le problème vient du
#             # microservice IA, pas d'une erreur du pêcheur.
#             return Response({"erreur": str(erreur)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

#         return Response(resultat, status=status.HTTP_200_OK)


# class CreerProduitView(APIView):
#     """
#     ÉTAPE 2 (cas Produit) : enregistrement définitif après confirmation.
#     Déclenche une notification n8n pour les acheteurs Premium si le produit correspond à une alerte.
#     """
#     permission_classes = [EstPecheur]

#     def post(self, request):
#         serializer = ProduitCreateSerializer(
#             data=request.data, context={"request": request}
#         )
#         serializer.is_valid(raise_exception=True)
#         produit = serializer.save()

#         # 1. Recherche des alertes actives correspondant au produit créé (ex: "Thiof")
#         # On filtre via la relation Foreign Key 'status_premium' du modèle Utilisateur
#         alertes_matching = Alerte.objects.filter(
#             nom_poisson__iexact=produit.nom,
#             statut=Alerte.Statut.ACTIVE,
#             acheteur__status_premium__fonction=Premium.Fonction.ABONNEMENT_ACHETEUR,
#             acheteur__status_premium__statut=Premium.Statut.ACTIF
#         ).select_related("acheteur").distinct()

#         # 2. Préparation des destinataires Premium
#         destinataires = [
#             {
#                 "acheteur_id": alerte.acheteur.id,
#                 "nom": f"{alerte.acheteur.prenom} {alerte.acheteur.nom}".strip() or alerte.acheteur.email,
#                 "telephone": getattr(alerte.acheteur, "telephone", ""),
#             }
#             for alerte in alertes_matching
#         ]

#         # 3. Envoi du webhook à n8n si des acheteurs Premium sont concernés
#         if destinataires:
#             payload = {
#                 "produit_id": produit.id,
#                 "nom_poisson": produit.nom,
#                 "prix_unitaire": float(produit.prix),
#                 "quantite_kg": float(produit.quantite),
#                 "pecheur_nom": f"{produit.pecheur.prenom} {produit.pecheur.nom}".strip() or produit.pecheur.telephone,
#                 "destinataires": destinataires,
#             }
#             envoyer_webhook_n8n("produit.publie_alerte_premium", payload)

#         return Response(ProduitSerializer(produit).data, status=status.HTTP_201_CREATED)


# class CreerInformationView(APIView):
#     """ÉTAPE 2 (cas Information) : enregistrement définitif après confirmation."""
#     permission_classes = [EstPecheur]

#     def post(self, request):
#         serializer = InformationCreateSerializer(
#             data=request.data, context={"request": request}
#         )
#         serializer.is_valid(raise_exception=True)
#         information = serializer.save()
#         return Response(InformationSerializer(information).data, status=status.HTTP_201_CREATED)


class ListeProduitsView(ListAPIView):
    """
    Fil des produits pour le filtre "Produits" de l'écran d'accueil.
    Visible par tous les utilisateurs connectés.
    Ne montre QUE les publications validées (statut_moderation=visible).

    NB : les produits en rupture restent dans la liste (avec statut="rupture").
    Le pêcheur en a besoin pour pouvoir les réactiver, et les acheteurs les
    voient grisés / non commandables côté front.
    """
    serializer_class = ProduitSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Produit.objects.filter(
            statut_moderation=Produit.StatutModeration.VISIBLE
        ).order_by("-date_publication")


class ListeInformationsView(ListAPIView):
    """Fil des informations pour le filtre "Informations" de l'écran d'accueil."""
    serializer_class = InformationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Information.objects.filter(
            statut_moderation=Information.StatutModeration.VISIBLE
        ).order_by("-date_publication")


class ChangerStatutProduitView(APIView):
    """
    Le pêcheur active / désactive la disponibilité de SON produit
    (disponible <-> rupture). Un produit en rupture ne peut plus être
    ajouté au panier ni commandé (voir CommandeCreateSerializer).
    """
    permission_classes = [EstPecheur]

    def patch(self, request, pk):
        # pecheur=request.user : impossible de modifier le produit d'un autre (404)
        produit = get_object_or_404(Produit, pk=pk, pecheur=request.user)
        nouveau = request.data.get("statut")

        if nouveau not in Produit.Statut.values:
            return Response(
                {"erreur": "Statut invalide."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        produit.statut = nouveau
        produit.save(update_fields=["statut"])
        return Response(ProduitSerializer(produit).data, status=status.HTTP_200_OK)





class PublierView(APIView):
    """
    ÉTAPE UNIQUE côté pêcheur : reçoit audio + média, appelle l'IA,
    enregistre DIRECTEMENT en base la publication (Produit ou Information).
    """
    permission_classes = [EstPecheur]

    def post(self, request):
        audio = request.FILES.get("audio")
        media = request.FILES.get("media")

        if not audio:
            return Response(
                {"erreur": "L'audio est obligatoire."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ---- 1. Analyse IA ----
        try:
            analyse = analyser_media(audio, media)
        except ErreurAnalyseIA as erreur:
            return Response(
                {"erreur": str(erreur)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        type_pub = analyse.get("type")
        suggestion = analyse.get("suggestion", {}) or {}
        score = analyse.get("score_confiance", 0.0)

        # ═══ 2. Détermination adresse + coordonnées ═══
        adresse = suggestion.get("adresse") or "Non précisé"

        # Priorité 1 : zone détectée par l'IA → géocodage
        lat, lng = None, None
        if adresse != "Non précisé":
            lat, lng = geocoder_adresse(adresse)

        # Priorité 2 : GPS du navigateur envoyé par le front
        if not lat or not lng:
            lat = request.data.get("latitude")
            lng = request.data.get("longitude")
            if lat and lng:
                print(f">>> [GPS FRONT] ({lat}, {lng})")

        # Priorité 3 : fallback Dakar centre
        if not lat or not lng:
            lat, lng = 14.6928, -17.4467
            adresse = "Dakar"
            print(">>> [FALLBACK] Zone inconnue → Dakar par défaut")

        # ---- 3. Construction du payload pour le serializer ----
        base = {
            "audio": audio,
            "adresse": adresse,
            "latitude": lat,
            "longitude": lng,
            "texte_transcrit": analyse.get("texte_transcrit", ""),
            "texte_traduit": analyse.get("texte_traduit", ""),
            "score_confiance_ia": score,
        }

        # ---- 4. Enregistrement ----
        if type_pub == "produit":
            if not media:
                type_pub = "information"

        if type_pub == "produit":
            serializer = ProduitCreateSerializer(
                data={
                    **base,
                    "media": media,
                    "nom": suggestion.get("nom") or "Produit non identifié",
                    "categorie": suggestion.get("categorie") or "poisson",
                    "prix": suggestion.get("prix") or 0,
                    "quantite": suggestion.get("quantite") or 0,
                },
                context={"request": request},
            )
        else:
            serializer = InformationCreateSerializer(
                data={
                    **base,
                    "description": suggestion.get("description")
                        or analyse.get("texte_traduit", ""),
                },
                context={"request": request},
            )

        serializer.is_valid(raise_exception=True)
        publication = serializer.save()

        # ═══ La zone a été canonisée par le serializer (canoniser_zone) ═══
        # Ex : "soumbedioune" → "Soumbédioune"

        # ---- 5. Notification FCM aux acheteurs Premium ----
        if type_pub == "produit":
            try:
                from .services.alerte_service import notifier_publication

                print(
                    f">>> [FCM] notifier_publication("
                    f"'{publication.nom}' @ '{publication.adresse}')"
                )
                result = notifier_publication(publication)
                print(f">>> [FCM] Résultat : {result}")

            except Exception as e:
                print(">>> [FCM] notification non envoyée :", e)
                import traceback
                traceback.print_exc()

        # ---- 6. Réponse ----
        if type_pub == "produit":
            data = ProduitSerializer(publication).data
        else:
            data = InformationSerializer(publication).data

        return Response(
            {
                **data,
                "type": type_pub,
                "en_attente_admin": publication.statut_moderation
                    == publication.StatutModeration.EN_ATTENTE,
            },
            status=status.HTTP_201_CREATED,
        )