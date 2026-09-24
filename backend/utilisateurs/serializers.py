from rest_framework import serializers
from rest_framework.serializers import ModelSerializer, Serializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import Utilisateur, ProfilPecheur, ProfilLivreur, Vehicule, Premium
from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from commandes.models import Note




class ProfilPecheurSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfilPecheur
        fields = ["est_verifie", "documents_pecheur"]


class VehiculeSerializer(serializers.ModelSerializer):
    type_vehicule_display = serializers.CharField(
        source="get_type_vehicule_display",
        read_only=True,
    )

    class Meta:
        model = Vehicule
        fields = [
            "id",
            "type_vehicule",
            "type_vehicule_display",
            "immatriculation",
            "est_frigorifie",
        ]


class ProfilLivreurSerializer(serializers.ModelSerializer):
    vehicule = VehiculeSerializer(read_only=True)

    class Meta:
        model = ProfilLivreur
        fields = [
            "est_verifie",
            "disponible",
            "document_verification",
            "vehicule",
        ]



class PremiumSerializer(serializers.ModelSerializer):
    fonction_display = serializers.CharField(
        source="get_fonction_display", read_only=True
    )
    statut_display = serializers.CharField(
        source="get_statut_display", read_only=True
    )

    class Meta:
        model = Premium
        fields = [
            "id",
            "fonction",
            "fonction_display",
            "statut",
            "statut_display",
            "date_obtention",
            "date_expiration",
            "validation_auto",
            "motif_validation",
            "duree_mois",
        ]



class UtilisateurSerializer(serializers.ModelSerializer):
    profil_pecheur = ProfilPecheurSerializer(read_only=True)
    profil_livreur = ProfilLivreurSerializer(read_only=True)
    status_premium = PremiumSerializer(many=True, read_only=True)   
    est_premium = serializers.SerializerMethodField()                


    class Meta:
        model = Utilisateur
        fields = [
            "id",
            "telephone",
            "email",
            "nom",
            "prenom",
            "adresse",
            "role",
            "date_inscription",
            "is_active",
            "status_premium",   
            "est_premium",      
            "profil_pecheur",
            "profil_livreur",
        ]
    def get_est_premium(self, obj):
            """True si l'utilisateur a au moins un Premium actif."""
            return obj.status_premium.filter(statut=Premium.Statut.ACTIF).exists()    


class InscriptionSerializer(ModelSerializer):
    code_pin = serializers.CharField(write_only=True, min_length=4, max_length=8)
 
    # Champs véhicule : requis uniquement si role == livreur (voir validate())
    type_vehicule = serializers.ChoiceField(
        choices=Vehicule.TypeVehicule.choices, write_only=True, required=False
    )
    immatriculation = serializers.CharField(write_only=True, required=False)
    est_frigorifie = serializers.BooleanField(write_only=True, required=False, default=False)
 
    class Meta:
        model = Utilisateur
        fields = [
            'telephone', 'code_pin', 'nom', 'prenom', 'adresse', 'role',
            'type_vehicule', 'immatriculation', 'est_frigorifie',
        ]
 
    def validate_role(self, value):
        if value == Utilisateur.Role.ADMIN:
            raise serializers.ValidationError("L'inscription directe en tant qu'admin n'est pas autorisée.")
        return value
 
    def validate(self, attrs):
        # Un livreur doit obligatoirement fournir son véhicule dès l'inscription
        if attrs.get('role') == Utilisateur.Role.LIVREUR:
            if not attrs.get('immatriculation') or not attrs.get('type_vehicule'):
                raise serializers.ValidationError(
                    "Le type de véhicule et l'immatriculation sont obligatoires pour un livreur."
                )
        return attrs
 
    def create(self, validated_data):
        code_pin = validated_data.pop('code_pin')
        type_vehicule = validated_data.pop('type_vehicule', None)
        immatriculation = validated_data.pop('immatriculation', None)
        est_frigorifie = validated_data.pop('est_frigorifie', False)
        role = validated_data.get('role')
 
        utilisateur = Utilisateur.objects.create_user(code_pin=code_pin, **validated_data)
 
        if role == Utilisateur.Role.LIVREUR:
            # Le Vehicule doit exister AVANT le ProfilLivreur, puisque
            # ProfilLivreur.vehicule est une relation obligatoire (pas null).
            vehicule = Vehicule.objects.create(
                type_vehicule=type_vehicule,
                immatriculation=immatriculation,
                est_frigorifie=est_frigorifie,
            )
            ProfilLivreur.objects.create(utilisateur=utilisateur, vehicule=vehicule)
 
        elif role == Utilisateur.Role.PECHEUR:
            ProfilPecheur.objects.create(utilisateur=utilisateur)
 
        return utilisateur
 


class ConnexionSerializer(Serializer): 
    """Serializer pour la connexion hybride (Email pour Admin, Téléphone pour les autres)."""
    identifiant=serializers.CharField(help_text="Numéro de téléphone pour les utilisateurs classiques, ou Email pour les Administrateurs.")

    mot_de_passe = serializers.CharField(write_only=True)

    def validate(self, attrs):
        identifiant=attrs.get('identifiant')
        mot_de_passe=attrs.get('mot_de_passe')

        user=authenticate(               # Utilise le backend hybride créé
        request=self.context.get('request'),
        username=identifiant,
        password=mot_de_passe
        )

        if not user:
            raise serializers.ValidationError("Identifiants incorrects ou compte inactif.")

        if not user.is_active:
            raise serializers.ValidationError("Ce compte a été désactivé.")

        refresh = RefreshToken.for_user(user)

        return{
            'user':UtilisateurSerializer(user).data,
            'tokens':{
                'refresh': str(refresh),
                'access':str(refresh.access_token)
            }
        }





class PremiumSouscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Premium
        fields = ["id", "fonction", "statut", "date_obtention", "date_expiration"]
        read_only_fields = ["id", "statut", "date_obtention", "date_expiration"]

    def create(self, validated_data):
        utilisateur = self.context["request"].user
        # Attribue automatiquement l'utilisateur connecté
        premium, _ = Premium.objects.get_or_create(
            utilisateur=utilisateur,
            fonction=validated_data["fonction"],
            defaults={"statut": Premium.Statut.EN_ATTENTE}
        )
        return premium    



class PremiumSerializer(serializers.ModelSerializer):
    """Serializer de LECTURE d'un Premium."""
    fonction_display = serializers.CharField(
        source="get_fonction_display", read_only=True
    )
    statut_display = serializers.CharField(
        source="get_statut_display", read_only=True
    )

    class Meta:
        model = Premium
        fields = [
            "id",
            "fonction",
            "fonction_display",
            "statut",
            "statut_display",
            "date_obtention",
            "date_expiration",
            "validation_auto",
            "motif_validation",
            "duree_mois",
        ]


class PremiumSouscriptionSerializer(serializers.Serializer):
    """
    Souscription à un abonnement Premium.
    Logique métier :
    - Utilisateur SANS problème → validation AUTO (statut = actif immédiatement)
    - Utilisateur AVEC 2+ signalements OU badge révoqué → validation MANUELLE (statut = en_attente)
    """
    fonction = serializers.ChoiceField(choices=Premium.Fonction.choices)
    duree_mois = serializers.IntegerField(min_value=1, max_value=12, default=1)

    def validate(self, attrs):
        utilisateur = self.context["request"].user
        fonction = attrs["fonction"]

        # ─── Détection des problèmes ───
        problemes = []

        # 1. Signalements (notes ≤ 2 étoiles reçues)
        nb_signalements = Note.objects.filter(
            cible=utilisateur, etoile__lte=2
        ).count()

        if nb_signalements >= 2:
            problemes.append(f"{nb_signalements} signalements")

        # 2. Badge déjà révoqué précédemment pour la même fonction
        a_badge_revoque = Premium.objects.filter(
            utilisateur=utilisateur,
            fonction=fonction,
            statut=Premium.Statut.REVOQUE,
        ).exists()

        if a_badge_revoque:
            problemes.append("badge révoqué précédemment")

        # On stocke les infos pour le create()
        attrs["_problemes"] = problemes
        return attrs

    def create(self, validated_data):
        utilisateur = self.context["request"].user
        fonction = validated_data["fonction"]
        duree_mois = validated_data["duree_mois"]
        problemes = validated_data.pop("_problemes", [])

        # ─── On retire les anciens premiums de la même fonction ───
        # (sauf ceux révoqués, on garde la trace)
        Premium.objects.filter(
            utilisateur=utilisateur,
            fonction=fonction,
            statut__in=[Premium.Statut.EN_ATTENTE, Premium.Statut.ACTIF],
        ).delete()

        # ─── Création du Premium ───
        premium = Premium(
            utilisateur=utilisateur,
            fonction=fonction,
            duree_mois=duree_mois,
        )

        if problemes:
            #  VALIDATION MANUELLE
            premium.statut = Premium.Statut.EN_ATTENTE
            premium.validation_auto = False
            premium.motif_validation = " / ".join(problemes)
            premium.date_obtention = None
            premium.date_expiration = None
        else:
            #  VALIDATION AUTOMATIQUE
            premium.statut = Premium.Statut.ACTIF
            premium.validation_auto = True
            premium.motif_validation = "Validation automatique"
            premium.date_obtention = timezone.now()
            premium.date_expiration = timezone.now() + timedelta(days=30 * duree_mois)

        premium.save()
        return premium    





