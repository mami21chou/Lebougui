import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Lebougui.settings")
django.setup()

from commandes.models import Commande, Livraison
from utilisateurs.models import ProfilLivreur
from django.utils import timezone

livreur = ProfilLivreur.objects.first()
print("Livreur :", livreur.utilisateur.prenom, livreur.utilisateur.nom)

cmd = Commande.objects.filter(statut="payee", livraisons__isnull=True).first()
print("Commande :", cmd.id, cmd.numero, cmd.adresse_livraison)

liv = Livraison.objects.create(
    livreur=livreur,
    statut="acceptee",
    tarif_livraison=1000.00,
    date_acceptation=timezone.now(),
)
liv.commandes.add(cmd)
print("Livraison créée #", liv.id)

liv.statut = "en_livraison"
liv.date_recuperation = timezone.now()
liv.save()
cmd.statut = "en_livraison"
cmd.save()
print("Commande #", cmd.id, "→", cmd.statut)

liv.statut = "livree"
liv.date_livraison = timezone.now()
liv.save()
cmd.statut = "livree"
cmd.save()
print("Commande #", cmd.id, "→", cmd.statut)