"""
App : commandes
Fichier : serializers.py
"""
from pydantic import ValidationError

from utilisateurs.models import Premium
from rest_framework import serializers
from publications.serializers import ProduitSerializer
from .models import Commande, ProduitCommande, Note, Alerte, Livraison


class ProduitCommandeSerializer(serializers.ModelSerializer):
    produit_detail = ProduitSerializer(source="produit", read_only=True)
    sous_total = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )

    class Meta:
        model = ProduitCommande
        fields = [
            "id",
            "produit",
            "produit_detail",
            "quantite",
            "prix_unitaire",
            "sous_total",
        ]
        read_only_fields = ["prix_unitaire"]


class CommandeSerializer(serializers.ModelSerializer):
    lignes = ProduitCommandeSerializer(many=True, read_only=True)
    nom_acheteur = serializers.CharField(source="acheteur.nom", read_only=True)
    nom_pecheur = serializers.CharField(source="pecheur.nom", read_only=True)

    class Meta:
        model = Commande
        fields = [
            "id",
            "numero",
            "acheteur",
            "nom_acheteur",
            "pecheur",
            "nom_pecheur",
            "statut",
            "distance_km",
            "frais_livraison",
            "date_commande",
            "date_limite_confirmation",
            "lignes",
        ]
        read_only_fields = ["numero", "date_commande", "acheteur", "distance_km", "frais_livraison"]


class RegrouperCommandesLivraisonSerializer(serializers.Serializer):
    commande_ids = serializers.ListField(
        child=serializers.IntegerField(), allow_empty=False
    )

    def validate_commande_ids(self, value):
        commandes = Commande.objects.filter(id__in=value).select_related("pecheur", "acheteur")

        if len(commandes) != len(value):
            raise serializers.ValidationError("Une ou plusieurs commandes n'existent pas.")

        if commandes.exclude(statut=Commande.Statut.EN_RECHERCHE_LIVREUR).exists():
            raise serializers.ValidationError("Certaines commandes ne sont pas en recherche de livreur.")

        zones_depart = {getattr(c.pecheur, 'zone', getattr(getattr(c.pecheur, 'profil', None), 'zone', None)) for c in commandes}
        if len(zones_depart) > 1:
            raise serializers.ValidationError("Toutes les commandes doivent être récupérées dans la même zone.")

        zones_arrivee = {getattr(c.acheteur, 'zone', getattr(getattr(c.acheteur, 'profil', None), 'zone', None)) for c in commandes}
        if len(zones_arrivee) > 1:
            raise serializers.ValidationError("Toutes les commandes doivent être livrées dans la même zone.")

        return value


class LivraisonSerializer(serializers.ModelSerializer):
    commandes_detail = CommandeSerializer(source="commandes", many=True, read_only=True)
    nom_livreur = serializers.CharField(source="livreur.utilisateur.nom", read_only=True)

    class Meta:
        model = Livraison
        fields = [
            "id",
            "livreur",
            "nom_livreur",
            "commandes",
            "commandes_detail",
            "statut",
            "tarif_livraison",
            "itineraire",
            "date_livraison",
        ]
        read_only_fields = ["livreur", "date_livraison"]


class NoteSerializer(serializers.ModelSerializer):
    nom_auteur = serializers.CharField(source="auteur.nom", read_only=True)
    nom_cible = serializers.CharField(source="cible.nom", read_only=True)

    class Meta:
        model = Note
        fields = [
            "id",
            "auteur",
            "nom_auteur",
            "cible",
            "nom_cible",
            "commande",
            "etoile",
            "commentaire",
            "date",
        ]
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



class AlerteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alerte
        # Uniquement les champs réels du modèle Alerte
        fields = ["id", "nom_poisson", "zone", "statut"]
        read_only_fields = ["id", "statut"]

    def validate(self, attrs):
        request = self.context.get("request")
        if request and request.user:
            user = request.user
            
            # Conservation de votre logique métier précise
            est_premium_actif = user.status_premium.filter(
                fonction=Premium.Fonction.ABONNEMENT_ACHETEUR,
                statut=Premium.Statut.ACTIF
            ).exists()

            if not est_premium_actif:
                raise serializers.ValidationError({
                    "detail": "Abonnez-vous à l'offre Premium pour pouvoir créer des alertes personnalisées."
                })

        return attrs

    def create(self, validated_data):
        # Association automatique de l'acheteur connecté
        validated_data["acheteur"] = self.context["request"].user
        return super().create(validated_data)