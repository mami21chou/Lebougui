"""
App : commandes
Modèles : Commande, ProduitCommande, Livraison, Note, Alerte
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from utilisateurs.models import Utilisateur, ProfilLivreur, Premium
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

    # Point de livraison choisi par l'acheteur. Le point de RÉCUPÉRATION,
    # lui, n'est pas dupliqué ici : il vient directement de la Publication
    # du produit commandé (produit.adresse / latitude / longitude).
    adresse_livraison = models.CharField(max_length=100, blank=True)
    latitude_livraison = models.FloatField(null=True, blank=True)
    longitude_livraison = models.FloatField(null=True, blank=True)

    distance_km = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    frais_livraison = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    statut = models.CharField(
        max_length=30, choices=Statut.choices, default=Statut.EN_ATTENTE_PECHEUR
    )
    paydunya_token = models.CharField(max_length=100, blank=True, null=True)

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
    """
    Une Livraison regroupe 1 à N commandes (même pêcheur + même zone).
    Elle n'existe QUE quand un livreur l'a acceptée.
    """

    class StatutLivraison(models.TextChoices):
        ACCEPTEE = "acceptee", "Acceptée par le livreur"
        EN_RECUPERATION = "en_recuperation", "Le livreur est au quai"
        EN_LIVRAISON = "en_livraison", "Le livreur est en route vers le client"
        LIVREE = "livree", "Livrée"
        ANNULEE = "annulee", "Annulée"

    livreur = models.ForeignKey(
        ProfilLivreur,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="livraisons",
    )
    commandes = models.ManyToManyField(Commande, related_name="livraisons")

    statut = models.CharField(
        max_length=30,
        choices=StatutLivraison.choices,
        default=StatutLivraison.ACCEPTEE,  
    )
    tarif_livraison = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    itineraire = models.JSONField(null=True, blank=True)

    position_latitude = models.FloatField(null=True, blank=True)
    position_longitude = models.FloatField(null=True, blank=True)
    position_updated_at = models.DateTimeField(null=True, blank=True)

    date_acceptation = models.DateTimeField(null=True, blank=True)
    date_recuperation = models.DateTimeField(null=True, blank=True)
    date_livraison = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        nom = self.livreur.utilisateur.nom if self.livreur and self.livreur.utilisateur else "Non assigné"
        return f"Livraison #{self.pk} - {nom} ({self.get_statut_display()})"
    

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

    traite = models.BooleanField(default=False)
    date_traitement = models.DateTimeField(null=True, blank=True)
    action_prise = models.CharField(max_length=200, blank=True)
    traite_par = models.ForeignKey(
        Utilisateur,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="signalements_traites",
    )

    class Meta:
        # Empêche le double-notation : 1 avis par (auteur, commande, cible)
        unique_together = ("auteur", "commande", "cible")
        ordering = ["-date"]

    def __str__(self):
        return f"Note {self.etoile}/5 de {self.auteur} à {self.cible}"

class Alerte(models.Model):
    """
    Alerte réservée aux acheteurs Premium : notifie l'acheteur (WhatsApp
    via n8n) dès qu'un produit correspondant (ex: Thiof) est publié.
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
        est_premium = self.acheteur.statuts_premium.filter(
            fonction=Premium.Fonction.ABONNEMENT_ACHETEUR,
            statut=Premium.Statut.ACTIF,
        ).exists()
        return f"Alerte '{self.nom_poisson}' - {self.acheteur.nom} ({'Premium' if est_premium else 'Gratuit'})"