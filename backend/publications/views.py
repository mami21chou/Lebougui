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
from utilisateurs.models import Utilisateur


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
    """ÉTAPE 2 (cas Produit) : enregistrement définitif après confirmation."""
    permission_classes = [EstPecheur]

    def post(self, request):
        serializer = ProduitCreateSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        produit = serializer.save()
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
    Visible par tous les utilisateurs connectés (pêcheurs ET acheteurs, cf.
    maquette : les deux voient défiler les publications des pêcheurs).
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