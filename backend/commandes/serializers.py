"""
App : commandes
Fichier : serializers.py
"""

import uuid
from rest_framework import serializers
from utilisateurs.models import Premium
from publications.models import Produit
from publications.serializers import ProduitSerializer
from .models import Commande, ProduitCommande, Note, Alerte, Livraison


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


class CommandeSerializer(serializers.ModelSerializer):
    """Serializer de LECTURE uniquement (affichage d'une commande existante)."""
    lignes = ProduitCommandeSerializer(many=True, read_only=True)
    nom_acheteur = serializers.CharField(source="acheteur.nom", read_only=True)
    nom_pecheur = serializers.CharField(source="pecheur.nom", read_only=True)

    class Meta:
        model = Commande
        fields = [
            "id", "numero", "acheteur", "nom_acheteur", "pecheur", "nom_pecheur",
            "statut", "adresse_livraison", "latitude_livraison", "longitude_livraison",
            "distance_km", "frais_livraison", "date_commande", "date_limite_confirmation",
            "lignes",
        ]
        read_only_fields = fields  # jamais utilisé en écriture, voir CommandeCreateSerializer


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
        produits = Produit.objects.filter(
            pk__in=[l["produit_id"] for l in attrs["lignes"]]
        ).select_related("pecheur")

        if produits.count() != len(attrs["lignes"]):
            raise serializers.ValidationError("Un ou plusieurs produits n'existent pas.")

        if len({p.pecheur_id for p in produits}) > 1:
            raise serializers.ValidationError(
                "Une commande ne peut contenir que des produits d'un seul pêcheur. "
                "Séparez votre panier par pêcheur avant de commander."
            )

        for ligne in attrs["lignes"]:
            produit = next(p for p in produits if p.id == ligne["produit_id"])
            if produit.statut != Produit.Statut.DISPONIBLE:
                raise serializers.ValidationError(f"Le produit '{produit.nom}' n'est plus disponible.")

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


class LivraisonSerializer(serializers.ModelSerializer):
    commandes_detail = CommandeSerializer(source="commandes", many=True, read_only=True)
    nom_livreur = serializers.SerializerMethodField()

    class Meta:
        model = Livraison
        fields = [
            "id", "livreur", "nom_livreur", "commandes", "commandes_detail",
            "statut", "tarif_livraison", "itineraire", "date_livraison",
        ]
        read_only_fields = ["livreur", "date_livraison"]

    def get_nom_livreur(self, livraison):
        if livraison.livreur is None:
            return None
        return livraison.livreur.utilisateur.nom


# =========================================================
# NOTE
# =========================================================

class NoteSerializer(serializers.ModelSerializer):
    nom_auteur = serializers.CharField(source="auteur.nom", read_only=True)
    nom_cible = serializers.CharField(source="cible.nom", read_only=True)

    class Meta:
        model = Note
        fields = ["id", "auteur", "nom_auteur", "cible", "nom_cible", "commande", "etoile", "commentaire", "date"]
        read_only_fields = ["auteur", "date"]

    def validate(self, attrs):
        commande = attrs.get("commande")
        cible = attrs.get("cible")

        pecheur_id = commande.pecheur_id
        livraison = commande.livraisons.first()
        livreur_id = (
            livraison.livreur.utilisateur_id
            if livraison and livraison.livreur
            else None
        )

        if cible.id not in [pecheur_id, livreur_id]:
            raise serializers.ValidationError(
                {"cible": "La cible notée doit être le pêcheur ou le livreur de la commande."}
            )
        return attrs


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