from django.shortcuts import render
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Utilisateur
from .serializers import ConnexionSerializer, InscriptionSerializer, UtilisateurSerializer, PremiumSouscriptionSerializer
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
        return Response(
            PremiumSouscriptionSerializer(premium).data,
            status=status.HTTP_201_CREATED
        )    