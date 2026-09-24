from django.shortcuts import render
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Utilisateur
from .serializers import ConnexionSerializer, InscriptionSerializer, UtilisateurSerializer, PremiumSouscriptionSerializer, PremiumSerializer
from rest_framework import status, permissions

class InscriptionView(APIView):
    """Endpoint pour l'inscription des Pêcheurs, Livreurs et Acheteurs."""

    permission_classes=[AllowAny]

    def post(self, request):
        serializer= InscriptionSerializer(data=request.data)
        if serializer.is_valid():
            utilisateur=serializer.save()
            return Response(
                {
                    "message":"Inscription reussie avec succes",
                    "user":UtilisateurSerializer(utilisateur).data,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ConnexionView(APIView):
    """Endpoint de connexion hybride (Email pour Admin, Téléphone pour Pêcheur/Acheteur/Livreur)."""

    permission_classes=[AllowAny]

    def post(self, request):
        serializer= ConnexionSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfilMeView(APIView):
    """Endpoint protégé permettant à l'utilisateur connecté de consulter ses informations."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UtilisateurSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)    



class SouscrirePremiumView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PremiumSouscriptionSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        premium = serializer.save()

        # On renvoie le premium + un message selon la validation
        return Response(
            {
                "premium": PremiumSerializer(premium).data,
                "success": True,
                "validation_manuelle_requise": not premium.validation_auto,
                "message": (
                    "Votre abonnement est actif immédiatement."
                    if premium.validation_auto
                    else f"Votre demande est en attente de validation par un administrateur. Motif : {premium.motif_validation}"
                ),
            },
            status=status.HTTP_201_CREATED,
        )


class ToggleDisponibleView(APIView):
    """
    Permet au livreur connecté de se mettre en ligne / hors ligne.
    Body: { "disponible": true }
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        user = request.user
        if user.role != Utilisateur.Role.LIVREUR:
            return Response(
                {"erreur": "Réservé aux livreurs."},
                status=status.HTTP_403_FORBIDDEN,
            )

        profil = user.profil_livreur
        profil.disponible = bool(request.data.get("disponible", True))
        profil.save(update_fields=["disponible"])

        return Response({"disponible": profil.disponible}, status=status.HTTP_200_OK)    