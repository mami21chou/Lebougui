import hashlib
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
import requests
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import APIView, action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from django.conf import settings
from utilisateurs.models import Premium, ProfilLivreur, Utilisateur
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


from datetime import timedelta
from django.db.models import Count, Q, Sum, F, ExpressionWrapper, DecimalField
from utilisateurs.models import ProfilPecheur, Vehicule


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
    # commandes/views.py

    @action(detail=True, methods=["post"], permission_classes=[EstAcheteur], url_path="payer-simule")
    def payer_simule(self, request, pk=None):
        """
        Simulation de paiement (remplace PayDunya pour la soutenance).
        Passe la commande en 'payee' si elle est en attente de paiement.
        """
        commande = self.get_object()

        # Sécurité : seul l'acheteur propriétaire peut payer
        if request.user.id != commande.acheteur_id:
            return Response(
                {"erreur": "Seul l'acheteur de cette commande peut payer."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if commande.statut != Commande.Statut.EN_ATTENTE_PAIEMENT:
            return Response(
                {"erreur": "Le paiement n'est possible qu'après confirmation du pêcheur."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        moyen = request.data.get("moyen_paiement", "wave")
        telephone = request.data.get("telephone", "")

        commande.statut = Commande.Statut.PAYEE
        commande.save(update_fields=["statut"])

        data = CommandeSerializer(commande).data
        data["moyen_paiement"] = moyen
        data["telephone"] = telephone

        print(f">>> [SIMULATION] Commande {commande.numero} → PAYEE via {moyen} ({telephone})")

        return Response(data, status=status.HTTP_200_OK)
    # commandes/views.py — APIView publique


# =========================================================
# 2. VIEWSET LIVRAISON
# =========================================================

class LivraisonViewSet(viewsets.ModelViewSet):
    serializer_class = LivraisonSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "profil_livreur"):
            return Livraison.objects.filter(livreur=user.profil_livreur).order_by("-id")
        return Livraison.objects.filter(
            commandes__in=Commande.objects.filter(Q(acheteur=user) | Q(pecheur=user))
        ).distinct()

    # --- Vérifie si un livreur est Premium ---
    @staticmethod
    def _est_livreur_premium(profil):
        return profil.utilisateur.status_premium.filter(
            fonction=Premium.Fonction.BADGE_LIVREUR,
            statut=Premium.Statut.ACTIF,
        ).exists()

    # --- Courses disponibles ---
    @action(detail=False, methods=["get"], permission_classes=[EstLivreur], url_path="disponibles")
    def disponibles(self, request):
        profil = request.user.profil_livreur

        if not profil.disponible:
            return Response({"resultats": [], "raison": "hors_ligne"})

        commandes_payees = Commande.objects.filter(
            statut=Commande.Statut.PAYEE,
            livraisons__isnull=True,
        ).select_related("pecheur", "acheteur").prefetch_related("lignes__produit").distinct()

        est_premium = self._est_livreur_premium(profil)

        if not est_premium:
            # Vérifier s'il existe un livreur Premium DISPONIBLE et LIBRE
            premium_libre = False
            for p in ProfilLivreur.objects.filter(disponible=True):
                if not self._est_livreur_premium(p):
                    continue
                en_cours = Livraison.objects.filter(
                    livreur=p,
                    statut__in=[
                        Livraison.StatutLivraison.ACCEPTEE,
                        Livraison.StatutLivraison.EN_RECUPERATION,
                        Livraison.StatutLivraison.EN_LIVRAISON,
                    ],
                ).exists()
                if not en_cours:
                    premium_libre = True
                    break

            if premium_libre:
                return Response({"resultats": [], "raison": "premiums_disponibles"})

        data = CommandeSerializer(commandes_payees, many=True).data
        return Response({"resultats": data})

    # --- Accepter une ou plusieurs commandes ---
    @action(detail=False, methods=["post"], permission_classes=[EstLivreur], url_path="accepter")
    def accepter(self, request):
        commande_ids = request.data.get("commande_ids", [])
        if not commande_ids:
            return Response({"erreur": "Aucune commande sélectionnée."}, status=400)

        profil = request.user.profil_livreur

        en_cours = Livraison.objects.filter(
            livreur=profil,
            statut__in=[
                Livraison.StatutLivraison.ACCEPTEE,
                Livraison.StatutLivraison.EN_RECUPERATION,
                Livraison.StatutLivraison.EN_LIVRAISON,
            ],
        ).exists()
        if en_cours:
            return Response({"erreur": "Vous avez déjà une livraison en cours."}, status=400)

        commandes = list(
            Commande.objects.filter(id__in=commande_ids)
            .select_related("pecheur", "acheteur")
            .prefetch_related("lignes__produit")
        )

        if len(commandes) != len(commande_ids):
            return Response({"erreur": "Une ou plusieurs commandes sont introuvables."}, status=404)

        for c in commandes:
            if c.statut != Commande.Statut.PAYEE:
                return Response(
                    {"erreur": f"La commande {c.numero} n'est pas dans un état payable."},
                    status=400,
                )

        if len({c.pecheur_id for c in commandes}) > 1:
            return Response({"erreur": "Toutes les commandes doivent être du même pêcheur."}, status=400)

        adresses = {c.adresse_livraison.strip().lower() for c in commandes}
        if len(adresses) > 1:
            return Response({"erreur": "Toutes les commandes doivent être dans la même zone."}, status=400)

        # Calcul distance
        premiere = commandes[0]
        premiere_ligne = premiere.lignes.first()
        distance_km = 0
        if (
            premiere_ligne and premiere_ligne.produit
            and premiere_ligne.produit.latitude and premiere.latitude_livraison
            and premiere_ligne.produit.longitude and premiere.longitude_livraison
        ):
            distance_km = calculer_distance_km(
                premiere_ligne.produit.latitude, premiere_ligne.produit.longitude,
                premiere.latitude_livraison, premiere.longitude_livraison,
            )

        frais = calculer_frais_livraison(distance_km)

        with transaction.atomic():
            livraison = Livraison.objects.create(
                livreur=profil,
                statut=Livraison.StatutLivraison.ACCEPTEE,
                tarif_livraison=frais,
                date_acceptation=timezone.now(),
            )
            livraison.commandes.set(commandes)

        data = LivraisonSerializer(livraison).data
        envoyer_webhook_n8n("livraison.acceptee", data)
        return Response(data, status=201)

    # --- Récupérer les commandes au quai ---
    @action(detail=True, methods=["post"], permission_classes=[EstLivreur], url_path="recuperer")
    def recuperer(self, request, pk=None):
        livraison = self.get_object()

        if livraison.livreur.utilisateur_id != request.user.id:
            return Response({"erreur": "Cette livraison ne vous appartient pas."}, status=403)

        if livraison.statut != Livraison.StatutLivraison.ACCEPTEE:
            return Response({"erreur": "Statut invalide."}, status=400)

        with transaction.atomic():
            livraison.statut = Livraison.StatutLivraison.EN_LIVRAISON
            livraison.date_recuperation = timezone.now()
            livraison.save()
            livraison.commandes.update(statut=Commande.Statut.EN_LIVRAISON)

        envoyer_webhook_n8n("livraison.recuperee", LivraisonSerializer(livraison).data)
        return Response(LivraisonSerializer(livraison).data)

    # --- Mise à jour GPS ---
    @action(detail=True, methods=["post"], permission_classes=[EstLivreur], url_path="position")
    def update_position(self, request, pk=None):
        livraison = self.get_object()

        if livraison.livreur.utilisateur_id != request.user.id:
            return Response({"erreur": "Non autorisé."}, status=403)

        lat = request.data.get("latitude")
        lng = request.data.get("longitude")
        if lat is None or lng is None:
            return Response({"erreur": "latitude et longitude requis."}, status=400)

        livraison.position_latitude = float(lat)
        livraison.position_longitude = float(lng)
        livraison.position_updated_at = timezone.now()
        livraison.save(update_fields=["position_latitude", "position_longitude", "position_updated_at"])
        return Response({"ok": True})

    # --- Terminer la livraison ---
    @action(detail=True, methods=["post"], permission_classes=[EstLivreur], url_path="terminer")
    def terminer(self, request, pk=None):
        livraison = self.get_object()

        if livraison.livreur.utilisateur_id != request.user.id:
            return Response({"erreur": "Non autorisé."}, status=403)

        if livraison.statut != Livraison.StatutLivraison.EN_LIVRAISON:
            return Response({"erreur": "Statut invalide."}, status=400)

        with transaction.atomic():
            livraison.statut = Livraison.StatutLivraison.LIVREE
            livraison.date_livraison = timezone.now()
            livraison.save()
            livraison.commandes.update(statut=Commande.Statut.LIVREE)

        envoyer_webhook_n8n("livraison.terminee", LivraisonSerializer(livraison).data)
        return Response(LivraisonSerializer(livraison).data)

    # --- Livraison en cours du livreur ---
    @action(detail=False, methods=["get"], permission_classes=[EstLivreur], url_path="en-cours")
    def en_cours(self, request):
        profil = request.user.profil_livreur
        livraison = Livraison.objects.filter(
            livreur=profil,
            statut__in=[
                Livraison.StatutLivraison.ACCEPTEE,
                Livraison.StatutLivraison.EN_RECUPERATION,
                Livraison.StatutLivraison.EN_LIVRAISON,
            ],
        ).order_by("-id").first()

        if not livraison:
            return Response({"en_cours": None})

        return Response({"en_cours": LivraisonSerializer(livraison).data})
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



# =========================================================
# 5. VIEWSET ADMIN — STATS & MODÉRATION
# =========================================================



class EstAdmin(permissions.BasePermission):
    """Réservé aux utilisateurs avec role = admin OU is_staff."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and (
                request.user.role == Utilisateur.Role.ADMIN
                or request.user.is_staff
            )
        )


class AdminViewSet(viewsets.ViewSet):
    """
    ViewSet dédié à l'administration de la plateforme Lebougui.
    Toutes les routes sont préfixées par /api/admin/
    """
    permission_classes = [EstAdmin]

    # ─────────────────────────────────────────────────────
    # 1. STATS GLOBALES
    # ─────────────────────────────────────────────────────
    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        now = timezone.now()
        debut_mois = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # Comptes
        total_utilisateurs = Utilisateur.objects.filter(is_active=True).count()
        total_pecheurs = Utilisateur.objects.filter(role=Utilisateur.Role.PECHEUR).count()
        total_acheteurs = Utilisateur.objects.filter(role=Utilisateur.Role.ACHETEUR).count()
        total_livreurs = Utilisateur.objects.filter(role=Utilisateur.Role.LIVREUR).count()

        # Vérifications en attente
        pecheurs_en_attente = ProfilPecheur.objects.filter(est_verifie=False).count()
        livreurs_en_attente = ProfilLivreur.objects.filter(est_verifie=False).count()

        # Commandes & CA (uniquement les commandes livrées)
        commandes_livrees = Commande.objects.filter(statut=Commande.Statut.LIVREE)
        commandes_livrees_mois = commandes_livrees.filter(date_commande__gte=debut_mois)

        ca_total = commandes_livrees.annotate(
            total_ligne=ExpressionWrapper(
                F("lignes__prix_unitaire") * F("lignes__quantite"),
                output_field=DecimalField(max_digits=14, decimal_places=2),
            )
        ).aggregate(total=Sum("total_ligne"))["total"] or 0

        ca_mois = commandes_livrees_mois.annotate(
            total_ligne=ExpressionWrapper(
                F("lignes__prix_unitaire") * F("lignes__quantite"),
                output_field=DecimalField(max_digits=14, decimal_places=2),
            )
        ).aggregate(total=Sum("total_ligne"))["total"] or 0

        # Premium
        premium_qs = Premium.objects.all()
        premium_actifs = premium_qs.filter(statut=Premium.Statut.ACTIF).count()
        premium_en_attente = premium_qs.filter(statut=Premium.Statut.EN_ATTENTE).count()
        abonnements_acheteur = premium_qs.filter(
            fonction=Premium.Fonction.ABONNEMENT_ACHETEUR,
            statut=Premium.Statut.ACTIF,
        ).count()
        badges_pecheur = premium_qs.filter(
            fonction=Premium.Fonction.BADGE_PECHEUR,
            statut=Premium.Statut.ACTIF,
        ).count()
        badges_livreur = premium_qs.filter(
            fonction=Premium.Fonction.BADGE_LIVREUR,
            statut=Premium.Statut.ACTIF,
        ).count()

        # Signalements et utilisateurs à révoquer
        utilisateurs_a_revoquer_qs = (
            Utilisateur.objects
            .filter(role__in=[Utilisateur.Role.PECHEUR, Utilisateur.Role.LIVREUR])
            .annotate(nb_signalements=Count("notes_recues", filter=Q(notes_recues__etoile__lte=2)))
            .filter(nb_signalements__gte=2)
        )

        return Response({
            "total_utilisateurs": total_utilisateurs,
            "total_pecheurs": total_pecheurs,
            "total_acheteurs": total_acheteurs,
            "total_livreurs": total_livreurs,
            "pecheurs_en_attente": pecheurs_en_attente,
            "livreurs_en_attente": livreurs_en_attente,
            "total_commandes": Commande.objects.count(),
            "commandes_mois": Commande.objects.filter(date_commande__gte=debut_mois).count(),
            "chiffre_affaires": float(ca_total),
            "chiffre_affaires_mois": float(ca_mois),
            "premium_actifs": premium_actifs,
            "premium_en_attente": premium_en_attente,
            "abonnements_acheteur": abonnements_acheteur,
            "badges_pecheur": badges_pecheur,
            "badges_livreur": badges_livreur,
            "utilisateurs_a_revoquer": utilisateurs_a_revoquer_qs.count(),
        })

    # ─────────────────────────────────────────────────────
    # 2. LISTE UTILISATEURS (filtrable par rôle)
    # ─────────────────────────────────────────────────────
    @action(detail=False, methods=["get"], url_path="utilisateurs")
    def utilisateurs(self, request):
        from .serializers import AdminUtilisateurSerializer

        role = request.query_params.get("role")
        recherche = request.query_params.get("q")
        statut_verif = request.query_params.get("verif")  # 'verifie' | 'attente'

        qs = Utilisateur.objects.all().order_by("-date_inscription")

        if role:
            qs = qs.filter(role=role)

        if recherche:
            qs = qs.filter(
                Q(prenom__icontains=recherche)
                | Q(nom__icontains=recherche)
                | Q(telephone__icontains=recherche)
            )

        if statut_verif == "verifie":
            qs = qs.filter(
                Q(profil_pecheur__est_verifie=True)
                | Q(profil_livreur__est_verifie=True)
            )
        elif statut_verif == "attente":
            qs = qs.filter(
                Q(profil_pecheur__est_verifie=False)
                | Q(profil_livreur__est_verifie=False)
            )

        # Prefetch pour éviter les N+1
        qs = qs.select_related("profil_pecheur", "profil_livreur").prefetch_related(
            "status_premium", "notes_recues"
        )

        serializer = AdminUtilisateurSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)

    # ─────────────────────────────────────────────────────
    # 3. DÉTAIL UTILISATEUR
    # ─────────────────────────────────────────────────────
    @action(detail=True, methods=["get"], url_path="detail")
    def detail_utilisateur(self, request, pk=None):
        from .serializers import AdminUtilisateurSerializer

        try:
            user = Utilisateur.objects.get(pk=pk)
        except Utilisateur.DoesNotExist:
            return Response({"erreur": "Utilisateur introuvable."}, status=404)

        serializer = AdminUtilisateurSerializer(user, context={"request": request})
        return Response(serializer.data)

    # ─────────────────────────────────────────────────────
    # 4. VALIDER LES DOCUMENTS d'un pêcheur/livreur
    # ─────────────────────────────────────────────────────
    @action(detail=True, methods=["post"], url_path="valider-document")
    def valider_document(self, request, pk=None):
        try:
            user = Utilisateur.objects.get(pk=pk)
        except Utilisateur.DoesNotExist:
            return Response({"erreur": "Utilisateur introuvable."}, status=404)

        if user.role == Utilisateur.Role.PECHEUR:
            try:
                profil = user.profil_pecheur
                profil.est_verifie = True
                profil.save()
            except ProfilPecheur.DoesNotExist:
                return Response({"erreur": "Profil pêcheur introuvable."}, status=404)

        elif user.role == Utilisateur.Role.LIVREUR:
            try:
                profil = user.profil_livreur
                profil.est_verifie = True
                profil.save()
            except ProfilLivreur.DoesNotExist:
                return Response({"erreur": "Profil livreur introuvable."}, status=404)
        else:
            return Response(
                {"erreur": "Seuls les pêcheurs et livreurs ont des documents à valider."},
                status=400,
            )

        return Response({"success": True, "message": "Documents validés."})

    # ─────────────────────────────────────────────────────
    # 5. RÉVOQUER LA VALIDATION
    # ─────────────────────────────────────────────────────
    @action(detail=True, methods=["post"], url_path="revoquer-document")
    def revoquer_document(self, request, pk=None):
        try:
            user = Utilisateur.objects.get(pk=pk)
        except Utilisateur.DoesNotExist:
            return Response({"erreur": "Utilisateur introuvable."}, status=404)

        if user.role == Utilisateur.Role.PECHEUR:
            try:
                user.profil_pecheur.est_verifie = False
                user.profil_pecheur.save()
            except ProfilPecheur.DoesNotExist:
                return Response({"erreur": "Profil pêcheur introuvable."}, status=404)

        elif user.role == Utilisateur.Role.LIVREUR:
            try:
                user.profil_livreur.est_verifie = False
                user.profil_livreur.save()
            except ProfilLivreur.DoesNotExist:
                return Response({"erreur": "Profil livreur introuvable."}, status=404)
        else:
            return Response({"erreur": "Rôle non autorisé."}, status=400)

        return Response({"success": True, "message": "Validation révoquée."})

    # ─────────────────────────────────────────────────────
    # 6. LISTE PREMIUMS (avec filtres)
    # ─────────────────────────────────────────────────────
    @action(detail=False, methods=["get"], url_path="premiums")
    def premiums(self, request):
        from .serializers import AdminPremiumSerializer

        statut = request.query_params.get("statut")  # 'actif' | 'en_attente' | 'revoque'
        fonction = request.query_params.get("fonction")

        qs = Premium.objects.all().select_related("utilisateur").order_by("-date_obtention")

        if statut:
            qs = qs.filter(statut=statut)

        if fonction:
            qs = qs.filter(fonction=fonction)

        serializer = AdminPremiumSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)

    # ─────────────────────────────────────────────────────
    # 7. VALIDER UN PREMIUM
    # ─────────────────────────────────────────────────────
    @action(detail=True, methods=["post"], url_path="valider-premium")
    def valider_premium(self, request, pk=None):
        try:
            premium = Premium.objects.get(pk=pk)
        except Premium.DoesNotExist:
            return Response({"erreur": "Premium introuvable."}, status=404)

        premium.statut = Premium.Statut.ACTIF
        premium.date_obtention = timezone.now()
        premium.date_expiration = timezone.now() + timedelta(days=30)
        premium.valide_par = request.user
        premium.save()

        return Response({
            "success": True,
            "message": "Premium activé pour 30 jours.",
            "date_expiration": premium.date_expiration,
        })

    # ─────────────────────────────────────────────────────
    # 8. RÉVOQUER UN PREMIUM (badge ou abonnement)
    # ─────────────────────────────────────────────────────
    @action(detail=True, methods=["post"], url_path="revoquer-premium")
    def revoquer_premium(self, request, pk=None):
        try:
            premium = Premium.objects.get(pk=pk)
        except Premium.DoesNotExist:
            return Response({"erreur": "Premium introuvable."}, status=404)

        motif = request.data.get("motif", "Révoqué par admin")

        premium.statut = Premium.Statut.REVOQUE
        premium.save()

        return Response({
            "success": True,
            "message": f"Premium révoqué. Motif : {motif}",
        })

    # ─────────────────────────────────────────────────────
    # 9. LISTE DES VÉHICULES
    # ─────────────────────────────────────────────────────
    @action(detail=False, methods=["get"], url_path="vehicules")
    def vehicules(self, request):
        from .serializers import AdminVehiculeSerializer

        type_vehicule = request.query_params.get("type")
        frigo = request.query_params.get("frigo")

        qs = Vehicule.objects.all().select_related("livreur__utilisateur")

        if type_vehicule:
            qs = qs.filter(type_vehicule=type_vehicule)

        if frigo == "true":
            qs = qs.filter(est_frigorifie=True)

        serializer = AdminVehiculeSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)

    
    # ─────────────────────────────────────────────────────
    # 10. SIGNALEMENTS (notes ≤ 2 étoiles)
    # ─────────────────────────────────────────────────────
    @action(detail=False, methods=["get"], url_path="signalements")
    def signalements(self, request):
        from .serializers import AdminSignalementSerializer

        traite = request.query_params.get("traite")
        cible = request.query_params.get("cible")

        qs = (
            Note.objects.filter(etoile__lte=2)
            .select_related("auteur", "cible", "commande", "traite_par")
            .order_by("-date")
        )

        if traite == "false":
            qs = qs.filter(traite=False)
        elif traite == "true":
            qs = qs.filter(traite=True)

        if cible == "pecheur":
            qs = qs.filter(cible__role=Utilisateur.Role.PECHEUR)
        elif cible == "livreur":
            qs = qs.filter(cible__role=Utilisateur.Role.LIVREUR)

        serializer = AdminSignalementSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)




    # ─────────────────────────────────────────────────────
    # 10.b TRAITER UN SIGNALEMENT
    # ─────────────────────────────────────────────────────
    @action(detail=True, methods=["post"], url_path="traiter-signalement")
    def traiter_signalement(self, request, pk=None):
        """
        Marque une note ≤ 2 étoiles comme traitée.
        Enregistre l'action prise et l'admin qui a traité.
        """
        try:
            note = Note.objects.get(pk=pk)
        except Note.DoesNotExist:
            return Response({"erreur": "Signalement introuvable."}, status=404)

        if note.etoile > 2:
            return Response(
                {"erreur": "Cette note n'est pas un signalement (≤ 2 étoiles requis)."},
                status=400,
            )

        action_prise = request.data.get("action_prise", "Signalement pris en compte")

        note.traite = True
        note.date_traitement = timezone.now()
        note.action_prise = action_prise
        note.traite_par = request.user
        note.save()

        return Response({
            "success": True,
            "message": "Signalement marqué comme traité.",
            "date_traitement": note.date_traitement,
            "action_prise": note.action_prise,
        })

    
    # ─────────────────────────────────────────────────────
    # 11. UTILISATEURS À RÉVOQUER (2+ signalements)
    # ─────────────────────────────────────────────────────
    @action(detail=False, methods=["get"], url_path="utilisateurs-a-revoquer")
    def utilisateurs_a_revoquer(self, request):
        from .serializers import AdminUtilisateurARevoquerSerializer

        qs = (
            Utilisateur.objects
            .filter(role__in=[Utilisateur.Role.PECHEUR, Utilisateur.Role.LIVREUR])
            .annotate(
                signalements=Count(
                    "notes_recues",
                    filter=Q(notes_recues__etoile__lte=2),
                )
            )
            .filter(signalements__gte=2)
            .order_by("-signalements")
        )

        serializer = AdminUtilisateurARevoquerSerializer(qs, many=True)
        return Response(serializer.data)

    # ─────────────────────────────────────────────────────
    # 12. RÉVOQUER TOUS LES BADGES d'un utilisateur signalé
    # ─────────────────────────────────────────────────────
    @action(detail=True, methods=["post"], url_path="revoquer-tous-badges")
    def revoquer_tous_badges(self, request, pk=None):
        try:
            user = Utilisateur.objects.get(pk=pk)
        except Utilisateur.DoesNotExist:
            return Response({"erreur": "Utilisateur introuvable."}, status=404)

        motif = request.data.get("motif", "Signalements multiples")

        # Révoque tous les Premiums actifs
        premiums_actifs = user.status_premium.filter(statut=Premium.Statut.ACTIF)
        nb = premiums_actifs.count()

        premiums_actifs.update(statut=Premium.Statut.REVOQUE)

        # Désactive aussi la vérification de documents si pêcheur/livreur
        if user.role == Utilisateur.Role.PECHEUR:
            try:
                user.profil_pecheur.est_verifie = False
                user.profil_pecheur.save()
            except ProfilPecheur.DoesNotExist:
                pass
        elif user.role == Utilisateur.Role.LIVREUR:
            try:
                user.profil_livreur.est_verifie = False
                user.profil_livreur.save()
            except ProfilLivreur.DoesNotExist:
                pass

        return Response({
            "success": True,
            "message": f"{nb} badge(s) révoqué(s). Motif : {motif}",
            "premiums_revoques": nb,
        })

    # ─────────────────────────────────────────────────────
    # 13. STATS POUR GRAPHIQUES (30 derniers jours)
    # ─────────────────────────────────────────────────────
    @action(detail=False, methods=["get"], url_path="stats-chart")
    def stats_chart(self, request):
        """Retourne les données pour le graphique du dashboard."""
        from datetime import date

        nb_jours = int(request.query_params.get("jours", 30))
        debut = timezone.now() - timedelta(days=nb_jours)

        # Commandes par jour
        commandes_par_jour = (
            Commande.objects
            .filter(date_commande__gte=debut)
            .extra(select={"jour": "DATE(date_commande)"})
            .values("jour")
            .annotate(count=Count("id"))
            .order_by("jour")
        )

        # CA par jour (commandes livrées)
        ca_par_jour = (
            Commande.objects
            .filter(date_commande__gte=debut, statut=Commande.Statut.LIVREE)
            .annotate(
                total_ligne=ExpressionWrapper(
                    F("lignes__prix_unitaire") * F("lignes__quantite"),
                    output_field=DecimalField(max_digits=14, decimal_places=2),
                )
            )
            .extra(select={"jour": "DATE(date_commande)"})
            .values("jour")
            .annotate(total=Sum("total_ligne"))
            .order_by("jour")
        )

        return Response({
            "commandes_par_jour": list(commandes_par_jour),
            "ca_par_jour": [
                {"jour": str(item["jour"]), "total": float(item["total"] or 0)}
                for item in ca_par_jour
            ],
        })

    # ─────────────────────────────────────────────────────
    # 14. COMMANDES ADMIN (vue globale)
    # ─────────────────────────────────────────────────────
    @action(detail=False, methods=["get"], url_path="commandes")
    def commandes(self, request):
        statut = request.query_params.get("statut")

        qs = (
            Commande.objects.all()
            .select_related("acheteur", "pecheur")
            .prefetch_related("lignes__produit")
            .order_by("-date_commande")
        )

        if statut:
            qs = qs.filter(statut=statut)

        serializer = CommandeSerializer(qs[:200], many=True)
        return Response(serializer.data)    



    # ─────────────────────────────────────────────────────
    # 15. STATS FINANCIÈRES (revenus Premium uniquement)
    # ─────────────────────────────────────────────────────
    @action(detail=False, methods=["get"], url_path="stats-financieres")
    def stats_financieres(self, request):
        """
        Revenus de la plateforme = abonnements Premium uniquement.
        Prix unique : 1 000 FCFA / mois pour tous les types de compte.
        """
        now = timezone.now()
        debut_mois = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        debut_annee = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

        # ─── Prix unique ───
        PRIX_PREMIUM_MENSUEL = 1000

        # ═══════════════════════════════════════════════════
        # PREMIUM ACTIFS (par type)
        # ═══════════════════════════════════════════════════
        premium_actifs = Premium.objects.filter(statut=Premium.Statut.ACTIF)

        abonnements_acheteur = premium_actifs.filter(
            fonction=Premium.Fonction.ABONNEMENT_ACHETEUR
        ).count()
        badges_pecheur = premium_actifs.filter(
            fonction=Premium.Fonction.BADGE_PECHEUR
        ).count()
        badges_livreur = premium_actifs.filter(
            fonction=Premium.Fonction.BADGE_LIVREUR
        ).count()

        total_actifs = abonnements_acheteur + badges_pecheur + badges_livreur

        # ═══════════════════════════════════════════════════
        # REVENUS MENSUELS (mois en cours)
        # ═══════════════════════════════════════════════════
        revenus_mois = total_actifs * PRIX_PREMIUM_MENSUEL

        # Détail par type
        revenus_acheteurs = abonnements_acheteur * PRIX_PREMIUM_MENSUEL
        revenus_pecheurs = badges_pecheur * PRIX_PREMIUM_MENSUEL
        revenus_livreurs = badges_livreur * PRIX_PREMIUM_MENSUEL

        # ═══════════════════════════════════════════════════
        # PREMIUMS EN ATTENTE (potentiel futur)
        # ═══════════════════════════════════════════════════
        premium_en_attente = Premium.objects.filter(
            statut=Premium.Statut.EN_ATTENTE
        ).count()

        revenus_potentiels = premium_en_attente * PRIX_PREMIUM_MENSUEL

        # ═══════════════════════════════════════════════════
        # REVENUS CUMULÉS (depuis le lancement)
        # ═══════════════════════════════════════════════════
        # Tous les premiums qui ont été activés au moins une fois
        premiums_actives_historique = Premium.objects.filter(
            date_obtention__isnull=False,
        ).count()

        revenus_total = premiums_actives_historique * PRIX_PREMIUM_MENSUEL

        # Revenus de l'année en cours
        premiums_annee = Premium.objects.filter(
            date_obtention__gte=debut_annee,
        ).count()
        revenus_annee = premiums_annee * PRIX_PREMIUM_MENSUEL

        return Response({
            "prix_mensuel": PRIX_PREMIUM_MENSUEL,

            "premium_actifs": {
                "acheteurs": abonnements_acheteur,
                "pecheurs": badges_pecheur,
                "livreurs": badges_livreur,
                "total": total_actifs,
            },

            "revenus_mois": {
                "acheteurs": revenus_acheteurs,
                "pecheurs": revenus_pecheurs,
                "livreurs": revenus_livreurs,
                "total": revenus_mois,
            },

            "premium_en_attente": premium_en_attente,
            "revenus_potentiels": revenus_potentiels,

            "revenus_annee": revenus_annee,
            "revenus_total": revenus_total,
        })