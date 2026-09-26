"""
App : commandes
Fichier : serializers.py
"""

import uuid
from rest_framework import serializers
from utilisateurs.models import Premium, ProfilPecheur, ProfilLivreur, Vehicule
from publications.models import Produit
from publications.serializers import ProduitSerializer
from .models import Commande, ProduitCommande, Note, Alerte, Livraison
from utilisateurs.models import Utilisateur  
# =========================================================
# COMMANDE — LECTURE
# =========================================================

class ProduitCommandeSerializer(serializers.ModelSerializer):
    produit_detail = ProduitSerializer(source="produit", read_only=True)
    sous_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = ProduitCommande
        fields = ["id", "produit", "produit_detail", "quantite", "prix_unitaire", "sous_total"]
        read_only_fields = ["prix_unitaire"]




# =========================================================
# COMMANDE — CRÉATION (le vrai "passer commande")
# =========================================================

class LigneInputSerializer(serializers.Serializer):
    """Un produit du panier envoyé par l'acheteur. Pas un ModelSerializer :
    on doit d'abord vérifier plusieurs règles avant de créer quoi que ce soit."""
    produit_id = serializers.IntegerField()
    quantite = serializers.DecimalField(max_digits=8, decimal_places=2, min_value=0.01)


class CommandeCreateSerializer(serializers.Serializer):
    """
    Reçoit le panier de l'acheteur + son adresse de livraison.
    Règle : un panier (= une commande) ne peut contenir que des produits
    d'UN SEUL pêcheur — le regroupement de pêcheurs différents se fait au
    niveau de la Livraison (voir RegrouperCommandesLivraisonSerializer),
    pas au niveau d'une commande individuelle.
    """
    lignes = LigneInputSerializer(many=True)
    adresse_livraison = serializers.CharField(max_length=100)
    latitude_livraison = serializers.FloatField(required=False, allow_null=True)
    longitude_livraison = serializers.FloatField(required=False, allow_null=True)

    def validate_lignes(self, lignes):
        if not lignes:
            raise serializers.ValidationError("La commande doit contenir au moins un produit.")
        return lignes

    def validate(self, attrs):
        produits = list(
            Produit.objects.filter(
                pk__in=[l["produit_id"] for l in attrs["lignes"]]
            ).select_related("pecheur")
        )

        if len(produits) != len(attrs["lignes"]):
            raise serializers.ValidationError("Un ou plusieurs produits n'existent pas.")

        if len({p.pecheur_id for p in produits}) > 1:
            raise serializers.ValidationError(
                "Une commande ne peut contenir que des produits d'un seul pêcheur. "
                "Séparez votre panier par pêcheur avant de commander."
            )

        # Disponibilité : un produit désactivé par le pêcheur (statut = rupture)
        # ne peut plus être commandé. On les liste TOUS d'un coup et on renvoie
        # leurs ids pour que le panier puisse les signaler à l'acheteur.
        indisponibles = [p for p in produits if p.statut != Produit.Statut.DISPONIBLE]
        if indisponibles:
            noms = ", ".join(f"« {p.nom} »" for p in indisponibles)
            raise serializers.ValidationError({
                "non_field_errors": [
                    f"Produit(s) indisponible(s) : {noms}. Retirez-les de votre panier."
                ],
                "produits_indisponibles": [p.id for p in indisponibles],
            })

        attrs["_produits"] = {p.id: p for p in produits}
        return attrs

    def create(self, validated_data):
        lignes = validated_data.pop("lignes")
        produits = validated_data.pop("_produits")
        premier_produit = next(iter(produits.values()))
        acheteur = self.context["request"].user

        commande = Commande.objects.create(
            acheteur=acheteur,
            pecheur=premier_produit.pecheur,
            numero=f"CMD-{uuid.uuid4().hex[:10].upper()}",
            statut=Commande.Statut.EN_ATTENTE_PECHEUR,
            **validated_data,  # adresse_livraison, latitude_livraison, longitude_livraison
        )

        for ligne in lignes:
            produit = produits[ligne["produit_id"]]
            ProduitCommande.objects.create(
                commande=commande, produit=produit,
                quantite=ligne["quantite"], prix_unitaire=produit.prix,
            )

        return commande


# =========================================================
# LIVRAISON
# =========================================================

class RegrouperCommandesLivraisonSerializer(serializers.Serializer):
    """
    Valide qu'un ensemble de commandes peut être regroupé dans UNE seule
    Livraison. Règle métier (validée avec le pêcheur/livreur) :
    - Récupération : toutes les commandes doivent partager le même lieu de
      récupération (même pêcheur, OU pêcheurs différents débarquant au
      même endroit — d'où la comparaison sur l'adresse du produit, pas sur
      l'identité du pêcheur).
    - Livraison : même client, OU même adresse de livraison si les clients
      sont différents.
    """
    commande_ids = serializers.ListField(
        child=serializers.IntegerField(), allow_empty=False
    )

    def validate_commande_ids(self, value):
        commandes = list(
            Commande.objects.filter(id__in=value)
            .select_related("pecheur", "acheteur")
            .prefetch_related("lignes__produit")
        )

        if len(commandes) != len(value):
            raise serializers.ValidationError("Une ou plusieurs commandes n'existent pas.")

        if any(c.statut != Commande.Statut.EN_RECHERCHE_LIVREUR for c in commandes):
            raise serializers.ValidationError(
                "Certaines commandes ne sont pas en recherche de livreur "
                "(déjà prises en charge, pas encore payées, ou déjà livrées)."
            )

        # Récupération : adresse du produit de chaque commande (premier
        # produit — rappel : une commande = un seul pêcheur, donc une
        # seule adresse de récupération par commande).
        zones_recuperation = set()
        for c in commandes:
            premiere_ligne = c.lignes.first()
            if premiere_ligne:
                zones_recuperation.add(premiere_ligne.produit.adresse)

        if len(zones_recuperation) > 1:
            raise serializers.ValidationError(
                "Ces commandes doivent être récupérées au même endroit "
                "(pêcheurs différents acceptés s'ils débarquent au même endroit)."
            )

        # Livraison : même client OU même adresse de livraison
        acheteurs = {c.acheteur_id for c in commandes}
        zones_livraison = {c.adresse_livraison for c in commandes}
        if len(acheteurs) > 1 and len(zones_livraison) > 1:
            raise serializers.ValidationError(
                "Ces commandes doivent concerner le même client, ou être "
                "livrées à la même adresse."
            )

        return value






class UtilisateurMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Utilisateur
        fields = ["id", "prenom", "nom", "telephone", "role"]


class CommandeSerializer(serializers.ModelSerializer):
    """Serializer de LECTURE d'une commande."""
    lignes = ProduitCommandeSerializer(many=True, read_only=True)
    acheteur_detail = UtilisateurMiniSerializer(source="acheteur", read_only=True)
    nom_acheteur = serializers.CharField(source="acheteur.nom", read_only=True)
    nom_pecheur = serializers.CharField(source="pecheur.nom", read_only=True)
    telephone_pecheur = serializers.CharField(source="pecheur.telephone", read_only=True)

    class Meta:
        model = Commande
        fields = [
            "id", "numero",
            "acheteur", "acheteur_detail", "nom_acheteur",
            "pecheur", "nom_pecheur", "telephone_pecheur",
            "statut", "adresse_livraison", "latitude_livraison", "longitude_livraison",
            "distance_km", "frais_livraison",
            "date_commande", "date_limite_confirmation",
            "lignes",
        ]
        read_only_fields = fields


class LivraisonSerializer(serializers.ModelSerializer):
    commandes_detail = CommandeSerializer(source="commandes", many=True, read_only=True)
    nom_livreur = serializers.SerializerMethodField()
    telephone_livreur = serializers.SerializerMethodField()

    class Meta:
        model = Livraison
        fields = [
            "id", "livreur", "nom_livreur", "telephone_livreur",
            "commandes", "commandes_detail",
            "statut", "tarif_livraison", "itineraire",
            "position_latitude", "position_longitude", "position_updated_at",
            "date_acceptation", "date_recuperation", "date_livraison",
        ]
        read_only_fields = ["livreur", "date_acceptation", "date_recuperation", "date_livraison"]

    def get_nom_livreur(self, livraison):
        if not livraison.livreur:
            return None
        u = livraison.livreur.utilisateur
        return f"{u.prenom} {u.nom}".strip() or u.telephone

    def get_telephone_livreur(self, livraison):
        if not livraison.livreur:
            return None
        return getattr(livraison.livreur.utilisateur, "telephone", None)    


# =========================================================
# NOTE
# =========================================================

class NoteSerializer(serializers.ModelSerializer):
    nom_auteur = serializers.CharField(source="auteur.nom", read_only=True)
    prenom_auteur = serializers.CharField(source="auteur.prenom", read_only=True)
    nom_cible = serializers.CharField(source="cible.nom", read_only=True)
    prenom_cible = serializers.CharField(source="cible.prenom", read_only=True)
    role_cible = serializers.CharField(source="cible.role", read_only=True)

    class Meta:
        model = Note
        fields = [
            "id", "auteur", "nom_auteur", "prenom_auteur",
            "cible", "nom_cible", "prenom_cible", "role_cible",
            "commande", "etoile", "commentaire", "date",
        ]
        read_only_fields = ["auteur", "date"]

    def validate(self, attrs):
        commande = attrs.get("commande")
        cible = attrs.get("cible")
        request = self.context.get("request")

        if not commande or not cible:
            raise serializers.ValidationError("Commande et cible obligatoires.")

        # La commande doit être livrée
        if commande.statut != "livree":
            raise serializers.ValidationError(
                {"commande": "Vous ne pouvez noter qu'une commande livrée."}
            )

        # Seul l'acheteur propriétaire peut noter
        if request and commande.acheteur_id != request.user.id:
            raise serializers.ValidationError(
                {"commande": "Vous ne pouvez noter que vos propres commandes."}
            )

        # La cible doit être le pêcheur OU le livreur
        pecheur_id = commande.pecheur_id
        livraison = commande.livraisons.first()
        livreur_id = (
            livraison.livreur.utilisateur_id
            if livraison and livraison.livreur
            else None
        )

        if cible.id not in [pecheur_id, livreur_id]:
            raise serializers.ValidationError(
                {"cible": "La cible doit être le pêcheur ou le livreur de cette commande."}
            )

        # Empêcher la double note
        if request and Note.objects.filter(
            auteur=request.user, commande=commande, cible=cible
        ).exists():
            raise serializers.ValidationError(
                {"detail": "Vous avez déjà noté cette personne pour cette commande."}
            )

        return attrs

    def create(self, validated_data):
        validated_data["auteur"] = self.context["request"].user
        return super().create(validated_data)


# =========================================================
# ALERTE (Premium)
# =========================================================

class AlerteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alerte
        fields = ["id", "nom_poisson", "zone", "statut"]
        read_only_fields = ["id", "statut"]

    def validate(self, attrs):
        request = self.context.get("request")
        if request and request.user:
            est_premium_actif = request.user.statuts_premium.filter(
                fonction=Premium.Fonction.ABONNEMENT_ACHETEUR,
                statut=Premium.Statut.ACTIF,
            ).exists()
            if not est_premium_actif:
                raise serializers.ValidationError({
                    "detail": "Abonnez-vous à l'offre Premium pour pouvoir créer des alertes personnalisées."
                })
        return attrs

    def create(self, validated_data):
        validated_data["acheteur"] = self.context["request"].user
        return super().create(validated_data)





# =========================================================
# ADMIN — SERIALIZERS DE LECTURE & MODÉRATION
# =========================================================

from utilisateurs.models import ProfilPecheur, ProfilLivreur, Vehicule
from django.db.models import Count


class AdminUtilisateurSerializer(serializers.ModelSerializer):
    """
    Serializer complet pour l'admin : profil + premium + signalements + véhicule.
    Utilisé dans /admin/utilisateurs/ pour afficher la liste complète.
    """
    profil_pecheur = serializers.SerializerMethodField()
    profil_livreur = serializers.SerializerMethodField()
    premiums = serializers.SerializerMethodField()
    signalements_recus = serializers.SerializerMethodField()
    premium_actif = serializers.SerializerMethodField()

    class Meta:
        model = Utilisateur
        fields = [
            "id", "prenom", "nom", "telephone", "email", "adresse", "role",
            "date_inscription", "is_active",
            "profil_pecheur", "profil_livreur",
            "premiums", "premium_actif", "signalements_recus",
        ]

    def get_profil_pecheur(self, obj):
        try:
            p = obj.profil_pecheur
            return {
                "est_verifie": p.est_verifie,
                "documents_pecheur": (
                    self.context["request"].build_absolute_uri(p.documents_pecheur.url)
                    if p.documents_pecheur
                    else None
                ),
            }
        except ProfilPecheur.DoesNotExist:
            return None

    def get_profil_livreur(self, obj):
        try:
            p = obj.profil_livreur
            return {
                "est_verifie": p.est_verifie,
                "disponible": p.disponible,
                "document_verification": (
                    self.context["request"].build_absolute_uri(p.document_verification.url)
                    if p.document_verification
                    else None
                ),
                "vehicule": (
                    {
                        "id": p.vehicule.id,
                        "type": p.vehicule.type_vehicule,
                        "type_display": p.vehicule.get_type_vehicule_display(),
                        "immatriculation": p.vehicule.immatriculation,
                        "est_frigorifie": p.vehicule.est_frigorifie,
                    }
                    if p.vehicule
                    else None
                ),
            }
        except ProfilLivreur.DoesNotExist:
            return None

    def get_premiums(self, obj):
        return [
            {
                "id": p.id,
                "fonction": p.fonction,
                "fonction_display": p.get_fonction_display(),
                "statut": p.statut,
                "date_obtention": p.date_obtention,
                "date_expiration": p.date_expiration,
            }
            for p in obj.status_premium.all().order_by("-date_obtention")
        ]

    def get_premium_actif(self, obj):
        """True si l'utilisateur a au moins un Premium actif."""
        return obj.status_premium.filter(statut=Premium.Statut.ACTIF).exists()

    def get_signalements_recus(self, obj):
        """
        Nombre de signalements = notes avec 1 ou 2 étoiles reçues.
        Utilisé pour la révocation automatique des badges.
        """
        return Note.objects.filter(cible=obj, etoile__lte=2).count()


class AdminPremiumSerializer(serializers.ModelSerializer):
    """Serializer Premium avec détails utilisateur pour l'admin."""
    utilisateur_detail = serializers.SerializerMethodField()

    class Meta:
        model = Premium
        fields = [
            "id", "fonction", "statut",
            "date_obtention", "date_expiration",
            "utilisateur", "utilisateur_detail",
            "valide_par",
        ]

    def get_utilisateur_detail(self, obj):
        u = obj.utilisateur
        return {
            "id": u.id,
            "nom": f"{u.prenom} {u.nom}".strip(),
            "telephone": u.telephone,
            "role": u.role,
            "photo": (
                self.context["request"].build_absolute_uri(u.photo.url)
                if getattr(u, "photo", None)
                else None
            ),
        }


class AdminVehiculeSerializer(serializers.ModelSerializer):
    """Véhicule avec info du livreur assigné."""
    livreur_detail = serializers.SerializerMethodField()

    class Meta:
        model = Vehicule
        fields = [
            "id", "type_vehicule", "immatriculation",
            "est_frigorifie", "livreur_detail",
        ]

    def get_livreur_detail(self, obj):
        try:
            livreur = obj.livreur
            u = livreur.utilisateur
            return {
                "id": u.id,
                "nom": f"{u.prenom} {u.nom}".strip(),
                "telephone": u.telephone,
                "est_verifie": livreur.est_verifie,
                "disponible": livreur.disponible,
            }
        except ProfilLivreur.DoesNotExist:
            return None


class AdminSignalementSerializer(serializers.ModelSerializer):
    """
    Signalement = note basse (1 ou 2 étoiles).
    Utilisé pour la modération et la révocation des badges.
    """
    auteur_detail = serializers.SerializerMethodField()
    cible_detail = serializers.SerializerMethodField()
    commande_numero = serializers.CharField(source="commande.numero", read_only=True)
    traite_par_detail = serializers.SerializerMethodField()

    class Meta:
        model = Note
        fields = [
            "id", "etoile", "commentaire", "date",
            "commande", "commande_numero",
            "auteur_detail", "cible_detail",
            "traite", "date_traitement", "action_prise",
            "traite_par", "traite_par_detail",
        ]

    def get_auteur_detail(self, obj):
        if not obj.auteur:
            return None
        return {
            "id": obj.auteur.id,
            "nom": f"{obj.auteur.prenom} {obj.auteur.nom}".strip(),
            "telephone": obj.auteur.telephone,
            "role": obj.auteur.role,
        }

    def get_cible_detail(self, obj):
        if not obj.cible:
            return None
        return {
            "id": obj.cible.id,
            "nom": f"{obj.cible.prenom} {obj.cible.nom}".strip(),
            "telephone": obj.cible.telephone,
            "role": obj.cible.role,
        }

    def get_traite_par_detail(self, obj):
        if not obj.traite_par:
            return None
        return {
            "id": obj.traite_par.id,
            "nom": f"{obj.traite_par.prenom} {obj.traite_par.nom}".strip(),
        }

class AdminUtilisateurARevoquerSerializer(serializers.ModelSerializer):
    """
    Utilisateur (pêcheur/livreur) ayant 2+ signalements → badge à révoquer.
    """
    signalements = serializers.IntegerField(read_only=True)

    class Meta:
        model = Utilisateur
        fields = ["id", "prenom", "nom", "telephone", "role", "signalements"]