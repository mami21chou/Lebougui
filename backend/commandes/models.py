"""
App : commandes
Modèles : Commande, ProduitCommande, Livraison, Note, Alerte
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from utilisateurs.models import Utilisateur, ProfilLivreur
from publications.models import Produit


class Commande(models.Model):
    class Statut(models.TextChoices):
        EN_ATTENTE_PECHEUR = "en_attente_pecheur", "En attente de confirmation du pêcheur"
        REFUSEE = "refusee", "Refusée par le pêcheur"
        ANNULEE = "annulee", "Annulée par l'acheteur"
        EN_ATTENTE_PAIEMENT = "en_attente_paiement", "En attente de paiement"
        PAYEE = "payee", "Payée"
        EN_RECHERCHE_LIVREUR = "en_recherche_livreur", "En recherche d'un livreur"
        EN_LIVRAISON = "en_livraison", "En cours de livraison"
        LIVREE = "livree", "Livrée"

    acheteur = models.ForeignKey(
        Utilisateur, on_delete=models.CASCADE,
        limit_choices_to={"role": Utilisateur.Role.ACHETEUR},
        related_name="commandes",
    )
    pecheur = models.ForeignKey(
        Utilisateur, on_delete=models.CASCADE,
        limit_choices_to={"role": Utilisateur.Role.PECHEUR},
        related_name="commandes_recues",
    )
    numero = models.CharField(max_length=20, unique=True)
    date_commande = models.DateTimeField(auto_now_add=True)
    date_limite_confirmation = models.DateTimeField(null=True, blank=True)
    
    distance_km = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    frais_livraison = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    statut = models.CharField(
        max_length=30, choices=Statut.choices, default=Statut.EN_ATTENTE_PECHEUR
    )

    def __str__(self):
        return f"Commande {self.numero} - {self.pecheur.nom}"


class ProduitCommande(models.Model):
    commande = models.ForeignKey(
        Commande, on_delete=models.CASCADE, related_name="lignes"
    )
    produit = models.ForeignKey(
        Produit, on_delete=models.PROTECT, related_name="lignes_commande"
    )
    quantite = models.DecimalField(max_digits=8, decimal_places=2)
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)

    @property
    def sous_total(self):
        return self.quantite * self.prix_unitaire

    def __str__(self):
        return f"{self.quantite} x {self.produit.nom} (Commande {self.commande.numero})"


class Livraison(models.Model):
    class StatutLivraison(models.TextChoices):
        EN_ATTENTE = "en_attente", "En attente d'un livreur"
        ACCEPTEE = "acceptee", "Acceptée par le livreur"
        EN_COURS = "en_cours", "En cours"
        LIVREE = "livree", "Livrée"

    livreur = models.ForeignKey(
        ProfilLivreur,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="livraisons"
    )
    commandes = models.ManyToManyField(Commande, related_name="livraisons")
    
    statut = models.CharField(
        max_length=30,
        choices=StatutLivraison.choices,
        default=StatutLivraison.EN_ATTENTE
    )
    tarif_livraison = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    itineraire = models.JSONField(null=True, blank=True)
    date_livraison = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Livraison #{self.pk} - Livreur: {self.livreur if self.livreur else 'Non assigné'}"


class Note(models.Model):
    auteur = models.ForeignKey(
        Utilisateur, on_delete=models.CASCADE,
        limit_choices_to={"role": Utilisateur.Role.ACHETEUR},
        related_name="notes_redigees",
    )
    cible = models.ForeignKey(
        Utilisateur, on_delete=models.CASCADE, related_name="notes_recues"
    )
    commande = models.ForeignKey(
        Commande, on_delete=models.CASCADE, related_name="notes"
    )
    etoile = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    commentaire = models.TextField(blank=True)
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Note {self.etoile}/5 de {self.auteur} à {self.cible}"

    
class Alerte(models.Model):
    """
    Alerte réservée aux acheteurs Premium :
    Notifie l'acheteur sur WhatsApp via n8n dès qu'un produit correspondant (ex: Thiof) est publié.
    """
    class Statut(models.TextChoices):
        ACTIVE = "active", "Active"
        INACTIVE = "inactive", "Inactive"

    acheteur = models.ForeignKey(
        Utilisateur, on_delete=models.CASCADE,
        limit_choices_to={"role": Utilisateur.Role.ACHETEUR},
        related_name="alertes",
    )
    nom_poisson = models.CharField(
        max_length=100, 
        help_text="Nom du produit surveillé (ex: Thiof, Capitaine, Crevettes)"
    )
    zone = models.CharField(max_length=100, blank=True)
    statut = models.CharField(
        max_length=10, choices=Statut.choices, default=Statut.ACTIVE
    )

    def __str__(self):
        return f"Alerte '{self.nom_poisson}' - {self.acheteur.nom} ({'Premium' if getattr(self.acheteur, 'est_premium', False) else 'Gratuit'})"