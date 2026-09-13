from rest_framework import serializers
from rest_framework.serializers import ModelSerializer, Serializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import Utilisateur, ProfilPecheur, ProfilLivreur, Vehicule

class UtilisateurSerializer(ModelSerializer):
    class Meta:
        model=Utilisateur
        fields=['id','telephone','email', 'nom', 'prenom', 'adresse', 'role','date_inscription']

# class InscriptionSerializer(ModelSerializer):
#     code_pin=serializers.CharField(write_only=True,min_length=4, max_length=8)

#     class Meta:
#         model= Utilisateur
#         fields=['telephone','code_pin','nom','prenom','adresse','role']  

#     def validate_role(self,value):
#         if value == Utilisateur.Role.ADMIN:
#             raise serializers.ValidationError("L'insription directe en tant que admin n'est pas autorisee")
#         return value

#     def create(self, validated_data):
#         code_pin= validated_data.pop('code_pin')
#         role =validated_data.get('role')

#         utilisateur=Utilisateur.objects.create_user(   #Création de l'utilisateur
#             code_pin=code_pin,
#             **validated_data
#         )    

#         if role==Utilisateur.Role.LIVREUR:
#             ProfilLivreur.objects.create(utilisateur=utilisateur)

#         elif role ==Utilisateur.Role.PECHEUR:
#             ProfilPecheur.objects.create(utilisateur=utilisateur)
#         return utilisateur


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