"""
Rôle : Définition du modèle Utilisateur personnalisé (authentification hybride)
       et des modèles liés (profils, véhicule, Premium).
"""

from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


# =========================================================
# MANAGER PERSONNALISÉ
# =========================================================

class UtilisateurManager(BaseUserManager):
    """
    Manager de création des utilisateurs.
    Nécessaire car Django ne sait pas, par défaut, créer un utilisateur
    identifié par un téléphone + code PIN.
    """

    def create_user(self, telephone, code_pin=None, secret=None, role=None, **extra_fields):
        """Crée un utilisateur standard (pêcheur, acheteur, livreur)."""
        password = secret or code_pin  # PIN ou mot de passe selon le rôle

        if not telephone:
            raise ValueError("Le numéro de téléphone est obligatoire.")
        if not password:
            raise ValueError("Le code PIN est obligatoire.")

        utilisateur = self.model(telephone=telephone, role=role, **extra_fields)
        utilisateur.set_password(password)          # hachage du mot de passe
        utilisateur.save(using=self._db)
        return utilisateur

    def create_superuser(self, email, password, **extra_fields):
        """Crée un administrateur (utilisé par `createsuperuser`)."""
        if not email:
            raise ValueError("L'email est obligatoire pour un superuser.")
        if not password:
            raise ValueError("Le mot de passe est obligatoire.")

        # Valeurs imposées pour un superuser
        extra_fields.setdefault("role", Utilisateur.Role.ADMIN)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        email = self.normalize_email(email)         # normalisation de l'email

        utilisateur = self.model(email=email, **extra_fields)
        utilisateur.set_password(password)
        utilisateur.save(using=self._db)
        return utilisateur


# =========================================================
# UTILISATEUR (modèle custom)
# =========================================================

class Utilisateur(AbstractBaseUser, PermissionsMixin):
    """
    Modèle utilisateur personnalisé.
    - AbstractBaseUser : identité + gestion du mot de passe.
    - PermissionsMixin : permissions, superuser, groupes.
    Authentification hybride : email (admin) OU téléphone (autres rôles).
    """

    # Rôles possibles dans la plateforme
    class Role(models.TextChoices):
        PECHEUR  = "pecheur",  "Pecheur"
        ACHETEUR = "acheteur", "Acheteur"
        LIVREUR  = "livreur",  "Livreur"
        ADMIN    = "admin",    "Admin"

    # Identifiants (un seul suffit selon le rôle)
    telephone = models.CharField(max_length=50, unique=True, null=True, blank=True)
    email     = models.EmailField(max_length=254, blank=True, null=True, unique=True)

    # Informations personnelles
    nom     = models.CharField(max_length=50)
    prenom  = models.CharField(max_length=50)
    adresse = models.CharField(max_length=250)
    role    = models.CharField(choices=Role.choices, max_length=30)

    # Champs système
    date_inscription = models.DateTimeField(auto_now_add=True)
    is_active        = models.BooleanField(default=True)
    is_staff         = models.BooleanField(default=False)

    # Manager personnalisé
    objects = UtilisateurManager()

    # Champs exigés par Django pour un modèle utilisateur custom
    USERNAME_FIELD  = "email"
    REQUIRED_FIELDS = ["nom", "prenom"]

    def __str__(self):
        identifiant = self.email if self.role == self.Role.ADMIN else self.telephone
        return f"{self.prenom} {self.nom} - {identifiant} ({self.get_role_display()})"

    @property
    def est_premium(self):
        """True si l'utilisateur possède au moins un Premium actif."""
        return self.status_premium.filter(statut=Premium.Statut.ACTIF).exists()


# =========================================================
# VÉHICULE (livreur)
# =========================================================

class Vehicule(models.Model):
    """Véhicule associé à un livreur."""

    class TypeVehicule(models.TextChoices):
        MOTO        = "moto",        "Moto / Scooter"
        VOITURE     = "voiture",     "Voiture"
        CAMIONNETTE = "camionnette", "Camionnette"
        TRICYCLE    = "tricycle",    "Tricycle"

    type_vehicule  = models.CharField(max_length=20, choices=TypeVehicule.choices)
    immatriculation = models.CharField(max_length=20, unique=True)
    est_frigorifie  = models.BooleanField(default=False)  # chaîne du froid

    def __str__(self):
        return f"{self.get_type_vehicule_display()} - {self.immatriculation}"


# =========================================================
# PROFIL LIVREUR
# =========================================================




class ProfilLivreur(models.Model):
    """Profil complémentaire pour les utilisateurs de rôle LIVREUR."""

    utilisateur = models.OneToOneField(
        Utilisateur, on_delete=models.CASCADE, related_name="profil_livreur"
    )
    disponible            = models.BooleanField(default=True)
    est_verifie           = models.BooleanField(default=False)
    document_verification = models.FileField(
        upload_to="documents_livreurs/", null=True, blank=True
    )
    vehicule = models.OneToOneField(
        Vehicule, on_delete=models.PROTECT, related_name="livreur"
    )

    # ═══ Position temps réel du livreur (hors livraison) ═══
    derniere_latitude    = models.FloatField(null=True, blank=True)
    derniere_longitude   = models.FloatField(null=True, blank=True)
    derniere_position_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Profil livreur - {self.utilisateur}"



# =========================================================
# PROFIL PÊCHEUR
# =========================================================

class ProfilPecheur(models.Model):
    """Profil complémentaire pour les utilisateurs de rôle PÊCHEUR."""

    utilisateur = models.OneToOneField(
        Utilisateur, on_delete=models.CASCADE, related_name="profil_pecheur"
    )
    est_verifie      = models.BooleanField(default=False)
    documents_pecheur = models.FileField(
        upload_to="documents_pecheur/", null=True, blank=True
    )

    def __str__(self):
        return f"Profil pêcheur - {self.utilisateur}"


# =========================================================
# PREMIUM (badges + abonnement)
# =========================================================

class Premium(models.Model):
    """
    Statut Premium d'un utilisateur.
    - 3 fonctions possibles (badge pêcheur, badge livreur, abonnement acheteur).
    - Validation automatique OU manuelle selon l'historique de signalements.
    """

    class Fonction(models.TextChoices):
        BADGE_PECHEUR        = "badge_pecheur",        "Badge_pecheur"
        BADGE_LIVREUR        = "badge_livreur",        "Badge_livreur"
        ABONNEMENT_ACHETEUR  = "abonnement_acheteur",  "Abonnement_acheteur"

    class Statut(models.TextChoices):
        EN_ATTENTE = "en_attente", "En_attente"
        ACTIF      = "actif",      "Actif"
        REVOQUE    = "revoque",    "Revoque"
        REJETE     = "rejete",     "Rejete"

    # ForeignKey : un utilisateur peut cumuler plusieurs Premiums vu que c'est un abonnement
    utilisateur = models.ForeignKey(
        Utilisateur, on_delete=models.CASCADE, related_name="status_premium"
    )
    fonction = models.CharField(choices=Fonction.choices, max_length=30)

    date_obtention  = models.DateTimeField(null=True, blank=True)
    date_expiration = models.DateTimeField(null=True, blank=True)
    statut = models.CharField(
        choices=Statut.choices, default=Statut.EN_ATTENTE, max_length=30
    )

    # Traçabilité de la validation
    validation_auto = models.BooleanField(
        default=False,
        help_text="True si validé automatiquement à l'achat (pas de problème détecté)",
    )
    motif_validation = models.CharField(
        max_length=200,
        blank=True,
        help_text="Raison de la validation manuelle (signalements, révocation…)",
    )

    # Admin ayant validé (null si validation automatique)
    valide_par = models.ForeignKey(
        Utilisateur,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={"role": Utilisateur.Role.ADMIN},
        related_name="premiums_valides",
    )
    duree_mois = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.fonction} - {self.utilisateur} ({self.statut})"




# =========================================================
# FCM TOKEN (notifications push Firebase)
# =========================================================

class FCMToken(models.Model):
    """Token d'un appareil pour recevoir les notifications push."""
    utilisateur = models.ForeignKey(
        Utilisateur, on_delete=models.CASCADE, related_name="fcm_tokens"
    )
    token = models.CharField(max_length=255, unique=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Token {self.utilisateur.prenom} - {self.token[:20]}..."    