from rest_framework import serializers
from .models import Produit, Information


class AnalyseSerializer(serializers.Serializer):
    """
    Serializer de l'ÉTAPE 1 (analyse). Pas de ModelSerializer ici : on ne
    sait pas encore si le résultat sera un Produit ou une Information.

    "media" est FACULTATIF ici : le pêcheur peut joindre une photo s'il
    décrit une prise, mais n'en a pas besoin pour signaler une zone. C'est
    l'IA qui déterminera le type ; le champ ne sera exigé qu'à l'étape 2,
    et seulement si le résultat est un Produit (voir ProduitCreateSerializer).
    """
    audio = serializers.FileField()
    media = serializers.FileField(required=False)


class ProduitCreateSerializer(serializers.ModelSerializer):
    """
    Serializer de l'ÉTAPE 2 pour un Produit : ce que le pêcheur envoie une
    fois qu'il a VALIDÉ (et éventuellement corrigé) la suggestion de l'IA.
    """

    class Meta:
        model = Produit
        fields = [
            "media", "audio", "adresse", "latitude", "longitude",
            "nom", "categorie", "prix", "quantite",
            "texte_transcrit", "texte_traduit", "score_confiance_ia",
        ]
        # "media" est ici, et OBLIGATOIRE  on sait  que c'est
        # un produit, donc la photo devient requise.
        # "pecheur" et "statut_moderation" ne sont volontairement PAS dans
        # cette liste : le pêcheur ne doit jamais pouvoir les fixer
        # lui-même depuis l'API.

    def create(self, validated_data):
        validated_data["pecheur"] = self.context["request"].user
        produit = Produit(**validated_data)
        produit.regle_moderation()
        produit.save()
        return produit


class InformationCreateSerializer(serializers.ModelSerializer):
    """
    Équivalent de ProduitCreateSerializer, pour une Information.
    Pas de champ "media" : le modèle Information n'en a pas.
    """

    class Meta:
        model = Information
        fields = [
            "audio", "adresse", "latitude", "longitude",
            "description", "texte_transcrit", "texte_traduit",
            "score_confiance_ia",
        ]

    def create(self, validated_data):
        validated_data["pecheur"] = self.context["request"].user
        information = Information(**validated_data)
        information.regle_moderation()
        information.save()
        return information


class ProduitSerializer(serializers.ModelSerializer):
    """Serializer de LECTURE, utilisé pour afficher un Produit (fil, détail)."""
    pecheur_nom = serializers.CharField(source="pecheur.nom", read_only=True)
    pecheur_prenom = serializers.CharField(source="pecheur.prenom", read_only=True)

    class Meta:
        model = Produit
        fields = [
            "id", "pecheur", "pecheur_nom", "pecheur_prenom",
            "date_publication", "media", "audio", "adresse",
            "latitude", "longitude", "nom", "categorie", "prix",
            "quantite", "statut", "statut_moderation",
        ]


class InformationSerializer(serializers.ModelSerializer):
    """Serializer de LECTURE pour une Information. Pas de champ "media"."""
    pecheur_nom = serializers.CharField(source="pecheur.nom", read_only=True)
    pecheur_prenom = serializers.CharField(source="pecheur.prenom", read_only=True)

    class Meta:
        model = Information
        fields = [
            "id", "pecheur", "pecheur_nom", "pecheur_prenom",
            "date_publication", "audio", "adresse",
            "latitude", "longitude", "description", "statut_moderation",
        ]