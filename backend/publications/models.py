from django.db import models
from utilisateurs.models import Utilisateur
# Create your models here.

class Publication(models.Model):

    class StatutModeration(models.TextChoices):
        VISIBLE = "visible", "Visible"
        EN_ATTENTE = "en_attente", "En attente de validation admin"
        REJETE = "rejete", "Rejeté par l'admin"

    SEUIL_CONFIANCE_IA = 0.70

    pecheur= models.ForeignKey(
        Utilisateur,
        on_delete=models.CASCADE,
        limit_choices_to={"role": Utilisateur.Role.PECHEUR},
        related_name="publications",
    )

    date_publication = models.DateTimeField(auto_now_add=True)
    audio = models.FileField(upload_to="publications/audio/")
    texte_transcrit = models.TextField(blank=True)
    texte_traduit = models.TextField(blank=True)
    score_confiance_ia = models.FloatField(null=True, blank=True)
    statut_moderation = models.CharField(max_length=15, choices=StatutModeration.choices, default=StatutModeration.EN_ATTENTE)
    adresse= models.CharField(max_length=50)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    def regle_moderation(self):
        if self.score_confiance_ia is not None and self.score_confiance_ia>=self.SEUIL_CONFIANCE_IA:
            self.statut_moderation=self.StatutModeration.VISIBLE
        else:
            self.statut_moderation=self.StatutModeration.EN_ATTENTE    

    def __str__(self):
            return f"Publication #{self.pk} - {self.pecheur}"        





class Produit(Publication):
    class Categorie(models.TextChoices):
        POISSON = "poisson", "Poisson"
        FRUIT_DE_MER = "fruit_de_mer", "Fruit de mer"

    class Statut(models.TextChoices):
        DISPONIBLE = "disponible", "Disponible"
        RUPTURE = "rupture", "Rupture de stock"     
    media = models.FileField(upload_to="publications/media/")
    nom = models.CharField(max_length=100)    
    categorie = models.CharField(max_length=20, choices=Categorie.choices)
    prix = models.DecimalField(max_digits=10, decimal_places=2)
    quantite = models.DecimalField(max_digits=8, decimal_places=2)
    
    statut = models.CharField(
            max_length=15, choices=Statut.choices, default=Statut.DISPONIBLE
        )

    def __str__(self):
            return f"{self.nom} ({self.get_categorie_display()})"


class Information(Publication):
    description = models.TextField()     

