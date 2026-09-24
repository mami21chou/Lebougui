"""
App : publications
Fichier : views.py
"""

from django.shortcuts import get_object_or_404
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView

from .models import Produit, Information
from .serializers import (
    AnalyseSerializer, ProduitCreateSerializer, InformationCreateSerializer,
    ProduitSerializer, InformationSerializer,
)
from .service_ia import analyser_media, ErreurAnalyseIA
from utilisateurs.models import Utilisateur, Premium

# Imports pour la gestion des alertes Premium et du webhook n8n
from commandes.models import Alerte
from commandes.services import envoyer_webhook_n8n


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


class AnalyserPublicationView(APIView):
    """
    ÉTAPE 1 : reçoit audio + média, interroge l'IA, renvoie une suggestion.
    NE SAUVEGARDE RIEN en base — c'est un aperçu que le pêcheur pourra
    corriger avant de confirmer (étape 2).
    """
    permission_classes = [EstPecheur]

    def post(self, request):
        serializer = AnalyseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            resultat = analyser_media(
                serializer.validated_data["audio"],
                serializer.validated_data.get("media"),  # None si non fourni
            )
        except ErreurAnalyseIA as erreur:
            # 503 = "Service indisponible" : le problème vient du
            # microservice IA, pas d'une erreur du pêcheur.
            return Response({"erreur": str(erreur)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        return Response(resultat, status=status.HTTP_200_OK)


class CreerProduitView(APIView):
    """
    ÉTAPE 2 (cas Produit) : enregistrement définitif après confirmation.
    Déclenche une notification n8n pour les acheteurs Premium si le produit correspond à une alerte.
    """
    permission_classes = [EstPecheur]

    def post(self, request):
        serializer = ProduitCreateSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        produit = serializer.save()

        # 1. Recherche des alertes actives correspondant au produit créé (ex: "Thiof")
        # On filtre via la relation Foreign Key 'status_premium' du modèle Utilisateur
        alertes_matching = Alerte.objects.filter(
            nom_poisson__iexact=produit.nom,
            statut=Alerte.Statut.ACTIVE,
            acheteur__status_premium__fonction=Premium.Fonction.ABONNEMENT_ACHETEUR,
            acheteur__status_premium__statut=Premium.Statut.ACTIF
        ).select_related("acheteur").distinct()

        # 2. Préparation des destinataires Premium
        destinataires = [
            {
                "acheteur_id": alerte.acheteur.id,
                "nom": f"{alerte.acheteur.prenom} {alerte.acheteur.nom}".strip() or alerte.acheteur.email,
                "telephone": getattr(alerte.acheteur, "telephone", ""),
            }
            for alerte in alertes_matching
        ]

        # 3. Envoi du webhook à n8n si des acheteurs Premium sont concernés
        if destinataires:
            payload = {
                "produit_id": produit.id,
                "nom_poisson": produit.nom,
                "prix_unitaire": float(produit.prix),
                "quantite_kg": float(produit.quantite),
                "pecheur_nom": f"{produit.pecheur.prenom} {produit.pecheur.nom}".strip() or produit.pecheur.telephone,
                "destinataires": destinataires,
            }
            envoyer_webhook_n8n("produit.publie_alerte_premium", payload)

        return Response(ProduitSerializer(produit).data, status=status.HTTP_201_CREATED)


class CreerInformationView(APIView):
    """ÉTAPE 2 (cas Information) : enregistrement définitif après confirmation."""
    permission_classes = [EstPecheur]

    def post(self, request):
        serializer = InformationCreateSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        information = serializer.save()
        return Response(InformationSerializer(information).data, status=status.HTTP_201_CREATED)


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
    enregistre DIRECTEMENT en base la publication (Produit ou Information),
    et renvoie l'objet créé. Le pêcheur n'a rien à saisir :
    tout (nom, prix, quantité, adresse, description) vient de l'IA.
    Le statut de modération est décidé automatiquement par
    Publication.regle_moderation (visible si score >= 0.70, sinon en_attente).
    """
    permission_classes = [EstPecheur]

    def post(self, request):
        audio = request.FILES.get("audio")
        media = request.FILES.get("media")  # peut être None

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

        # ---- 2. Construction du payload pour le serializer ----
        base = {
            "audio": audio,
            "adresse": suggestion.get("adresse") or "Non précisé",
            "latitude": suggestion.get("latitude"),
            "longitude": suggestion.get("longitude"),
            "texte_transcrit": analyse.get("texte_transcrit", ""),
            "texte_traduit": analyse.get("texte_traduit", ""),
            "score_confiance_ia": score,
        }

        # ---- 3. Enregistrement ----
        if type_pub == "produit":
            if not media:
                # Sécurité : pas de photo => on retombe sur Information
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

        # ---- 4. Notification Premium (uniquement pour Produit) ----
        if type_pub == "produit":
            try:
                alertes_matching = Alerte.objects.filter(
                    nom_poisson__iexact=publication.nom,
                    statut=Alerte.Statut.ACTIVE,
                    acheteur__status_premium__fonction=Premium.Fonction.ABONNEMENT_ACHETEUR,
                    acheteur__status_premium__statut=Premium.Statut.ACTIF,
                ).select_related("acheteur").distinct()

                destinataires = [
                    {
                        "acheteur_id": a.acheteur.id,
                        "nom": f"{a.acheteur.prenom} {a.acheteur.nom}".strip()
                            or a.acheteur.email,
                        "telephone": getattr(a.acheteur, "telephone", ""),
                    }
                    for a in alertes_matching
                ]

                if destinataires:
                    envoyer_webhook_n8n(
                        "produit.publie_alerte_premium",
                        {
                            "produit_id": publication.id,
                            "nom_poisson": publication.nom,
                            "prix_unitaire": float(publication.prix),
                            "quantite_kg": float(publication.quantite),
                            "pecheur_nom": f"{publication.pecheur.prenom} {publication.pecheur.nom}".strip()
                                or publication.pecheur.telephone,
                            "destinataires": destinataires,
                        },
                    )
            except Exception as e:
                print(">>> webhook n8n non envoyé :", e)

        # ---- 5. Réponse ----
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