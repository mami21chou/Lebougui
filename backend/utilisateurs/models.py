from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


class UtilisateurManager(BaseUserManager):
    """
    Un "manager" est l'objet qui sait comment CRÉER des Utilisateur.
    Django en a besoin dès qu'on remplace son système d'utilisateur par défaut
    (car par défaut, Django s'attend à un username/email, pas à un téléphone).
    """
    def create_user(self, telephone, code_pin=None, secret=None, role=None, **extra_fields):
        password = secret or code_pin
        if not telephone:
            raise ValueError("Le numéro de téléphone est obligatoire.")
        if not password:
            raise ValueError("Le code PIN est obligatoire.")
        utilisateur = self.model(telephone=telephone, role=role, **extra_fields)
        utilisateur.set_password(password)
        utilisateur.save(using=self._db)
        return utilisateur

    def create_superuser(self, email, password, **extra_fields):
        if not email:
            raise ValueError("L'email est obligatoire pour un superuser.")
        if not password:
            raise ValueError("Le mot de passe est obligatoire.")
        extra_fields.setdefault("role", Utilisateur.Role.ADMIN)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        email = self.normalize_email(email)

        utilisateur = self.model(email=email, **extra_fields)
        utilisateur.set_password(password)
        utilisateur.save(using=self._db)
        return utilisateur


class Utilisateur(AbstractBaseUser, PermissionsMixin):    

    class Role(models.TextChoices):
        PECHEUR = "pecheur", "Pecheur"
        ACHETEUR = "acheteur", "Acheteur"
        LIVREUR = "livreur", "Livreur"
        ADMIN = "admin", "Admin"

    telephone = models.CharField(max_length=50, unique=True, null=True, blank=True)    
    email = models.EmailField(max_length=254, blank=True, null=True, unique=True)
    nom = models.CharField(max_length=50)
    prenom = models.CharField(max_length=50)
    adresse = models.CharField(max_length=250)
    role = models.CharField(choices=Role.choices, max_length=30)
    date_inscription = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UtilisateurManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["nom", "prenom"]

    def __str__(self):
        identifiant = self.email if self.role == self.Role.ADMIN else self.telephone
        return f"{self.prenom} {self.nom} - {identifiant} ({self.get_role_display()})"

    @property
    def est_premium(self):
        """Retourne True si l'utilisateur possède au moins un statut Premium actif."""
        return self.status_premium.filter(statut=Premium.Statut.ACTIF).exists()


class Vehicule(models.Model):
    class TypeVehicule(models.TextChoices):
        MOTO = "moto", "Moto / Scooter"
        VOITURE = "voiture", "Voiture"
        CAMIONNETTE = "camionnette", "Camionnette"
        TRICYCLE = "tricycle", "Tricycle"

    type_vehicule = models.CharField(max_length=20, choices=TypeVehicule.choices)
    immatriculation = models.CharField(max_length=20, unique=True)
    est_frigorifie = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.get_type_vehicule_display()} - {self.immatriculation}"


class ProfilLivreur(models.Model):
    utilisateur = models.OneToOneField(Utilisateur, on_delete=models.CASCADE, related_name="profil_livreur")
    disponible = models.BooleanField(default=True)
    est_verifie = models.BooleanField(default=False)
    document_verification = models.FileField(upload_to="documents_livreurs/", null=True, blank=True)
    vehicule = models.OneToOneField(
        Vehicule, on_delete=models.PROTECT, related_name="livreur"
    )    

    def __str__(self):
        return f"Profil livreur - {self.utilisateur}"


class ProfilPecheur(models.Model):
    utilisateur = models.OneToOneField(Utilisateur, on_delete=models.CASCADE, related_name="profil_pecheur")
    est_verifie = models.BooleanField(default=False)
    documents_pecheur = models.FileField(upload_to="documents_pecheur/", null=True, blank=True)

    def __str__(self):
        return f"Profil pêcheur - {self.utilisateur}"    


class Premium(models.Model):

    class Fonction(models.TextChoices):
        BADGE_PECHEUR = "badge_pecheur", "Badge_pecheur"
        BADGE_LIVREUR = "badge_livreur", "Badge_livreur"
        ABONNEMENT_ACHETEUR = "abonnement_acheteur", "Abonnement_acheteur"

    class Statut(models.TextChoices):
        EN_ATTENTE = "en_attente", "En_attente"
        ACTIF = "actif", "Actif"
        REVOQUE = "revoque", "Revoque"
        REJETE = "rejete", "Rejete"

    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name="status_premium")   
    fonction = models.CharField(choices=Fonction.choices, max_length=30)
    date_obtention = models.DateTimeField(null=True, blank=True)
    date_expiration = models.DateTimeField(null=True, blank=True) 
    statut = models.CharField(choices=Statut.choices, default=Statut.EN_ATTENTE, max_length=30)
    
    validation_auto = models.BooleanField(
        default=False,
        help_text="True si validé automatiquement à l'achat (pas de problème détecté)",
    )
    motif_validation = models.CharField(
        max_length=200,
        blank=True,
        help_text="Raison de la validation manuelle (signalements, révocation…)",
    )

    
    valide_par = models.ForeignKey(
        Utilisateur, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        limit_choices_to={"role": Utilisateur.Role.ADMIN}, 
        related_name="premiums_valides"
    )
    duree_mois = models.PositiveIntegerField(default=1)


    def __str__(self):
        return f"{self.fonction} - {self.utilisateur} ({self.statut})"