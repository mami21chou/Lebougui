"""
App : publications
Fichier : views.py
"""

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