from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from utilisateurs.models import Utilisateur, Premium
from .models import Commande, Livraison, Note, Alerte
from .serializers import (
    CommandeSerializer,
    CommandeCreateSerializer,
    LivraisonSerializer,
    RegrouperCommandesLivraisonSerializer,
    NoteSerializer,
    AlerteSerializer,
)
from .services import calculer_distance_km, calculer_frais_livraison, envoyer_webhook_n8n


# =========================================================
# PERMISSIONS
# =========================================================

class EstAcheteur(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == Utilisateur.Role.ACHETEUR
        )


class EstPecheur(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == Utilisateur.Role.PECHEUR
        )


class EstLivreur(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, "profil_livreur")
        )


class EstAcheteurPremium(permissions.BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated
                and request.user.role == Utilisateur.Role.ACHETEUR):
            return False

        est_premium_actif = request.user.status_premium.filter(
            fonction=Premium.Fonction.ABONNEMENT_ACHETEUR,
            statut=Premium.Statut.ACTIF,
        ).exists()

        if not est_premium_actif:
            raise PermissionDenied({
                "code": "A_ABONNEMENT_PREMIUM_REQUIS",
                "detail": "La création d'alertes instantanées est une fonctionnalité exclusive Premium.",
                "incitation": "Abonnez-vous à la formule Premium pour être notifié par WhatsApp dès qu'un pêcheur publie du poisson !"
            })

        return True    


# =========================================================
# 1. VIEWSET COMMANDE
# =========================================================

class CommandeViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        # Utilise CommandeCreateSerializer à la création et CommandeSerializer en lecture
        if self.action == "create":
            return CommandeCreateSerializer
        return CommandeSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == Utilisateur.Role.ACHETEUR:
            return Commande.objects.filter(acheteur=user).order_by("-date_commande")
        elif user.role == Utilisateur.Role.PECHEUR:
            return Commande.objects.filter(pecheur=user).order_by("-date_commande")
        elif hasattr(user, "profil_livreur"):
            return Commande.objects.filter(
                statut=Commande.Statut.EN_RECHERCHE_LIVREUR
            ).order_by("date_commande")
        return Commande.objects.none()

    def perform_create(self, serializer):
        commande = serializer.save()
        envoyer_webhook_n8n("commande.creee", CommandeSerializer(commande).data)

    @action(detail=True, methods=["post"], permission_classes=[EstPecheur], url_path="confirmer")
    def confirmer_commande(self, request, pk=None):
        commande = self.get_object()

        if commande.statut != Commande.Statut.EN_ATTENTE_PECHEUR:
            return Response(
                {"erreur": "Cette commande ne peut plus être confirmée."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Calcul de la distance basé sur les coordonnées GPS du produit commandé
        premiere_ligne = commande.lignes.first()
        if premiere_ligne and premiere_ligne.produit:
            prod = premiere_ligne.produit
            if prod.latitude and commande.latitude_livraison:
                dist = calculer_distance_km(
                    float(prod.latitude), float(prod.longitude),
                    float(commande.latitude_livraison), float(commande.longitude_livraison)
                )
                commande.distance_km = round(dist, 2)
                commande.frais_livraison = calculer_frais_livraison(dist)

        commande.statut = Commande.Statut.EN_ATTENTE_PAIEMENT
        commande.save()

        data = CommandeSerializer(commande).data
        envoyer_webhook_n8n("commande.confirmee", data)

        return Response(data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[EstPecheur], url_path="refuser")
    def refuser_commande(self, request, pk=None):
        commande = self.get_object()

        if commande.statut != Commande.Statut.EN_ATTENTE_PECHEUR:
            return Response(
                {"erreur": "Cette commande ne peut plus être refusée."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        commande.statut = Commande.Statut.REFUSEE
        commande.save()
        return Response(CommandeSerializer(commande).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[EstAcheteur], url_path="annuler")
    def annuler_commande(self, request, pk=None):
        commande = self.get_object()
        statuts_annulables = [
            Commande.Statut.EN_ATTENTE_PECHEUR,
            Commande.Statut.EN_ATTENTE_PAIEMENT,
        ]

        if commande.statut not in statuts_annulables:
            return Response(
                {"erreur": "Cette commande ne peut plus être annulée à ce stade."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        commande.statut = Commande.Statut.ANNULEE
        commande.save()
        return Response(CommandeSerializer(commande).data, status=status.HTTP_200_OK)


# =========================================================
# 2. VIEWSET LIVRAISON
# =========================================================

class LivraisonViewSet(viewsets.ModelViewSet):
    serializer_class = LivraisonSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "profil_livreur"):
            return Livraison.objects.filter(livreur=user.profil_livreur)
        return Livraison.objects.filter(
            commandes__in=Commande.objects.filter(
                Q(acheteur=user) | Q(pecheur=user)
            )
        ).distinct()

    @action(detail=False, methods=["post"], permission_classes=[EstLivreur], url_path="regrouper-et-accepter")
    def regrouper_et_accepter(self, request):
        serializer = RegrouperCommandesLivraisonSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        commande_ids = serializer.validated_data["commande_ids"]
        commandes = Commande.objects.filter(id__in=commande_ids)

        with transaction.atomic():
            livraison = Livraison.objects.create(
                livreur=request.user.profil_livreur,
                statut=Livraison.StatutLivraison.ACCEPTEE,
            )
            livraison.commandes.set(commandes)
            commandes.update(statut=Commande.Statut.EN_LIVRAISON)

        data = LivraisonSerializer(livraison).data
        envoyer_webhook_n8n("livraison.acceptee", data)

        return Response(data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], permission_classes=[EstLivreur], url_path="terminer")
    def terminer_livraison(self, request, pk=None):
        livraison = self.get_object()

        with transaction.atomic():
            livraison.statut = Livraison.StatutLivraison.LIVREE
            livraison.date_livraison = timezone.now()
            livraison.save()
            livraison.commandes.update(statut=Commande.Statut.LIVREE)

        return Response(LivraisonSerializer(livraison).data, status=status.HTTP_200_OK)


# =========================================================
# 3. VIEWSET NOTE
# =========================================================

class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Note.objects.filter(Q(auteur=user) | Q(cible=user)).order_by("-date")

    def perform_create(self, serializer):
        serializer.save(auteur=self.request.user)


# =========================================================
# 4. VIEWSET ALERTE (EXCLUSIF PREMIUM)
# =========================================================

class AlerteViewSet(viewsets.ModelViewSet):
    serializer_class = AlerteSerializer
    permission_classes = [EstAcheteurPremium]

    def get_queryset(self):
        return Alerte.objects.filter(acheteur=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)