from django.urls import path
from .views import (
    ListeProduitsView, ListeInformationsView,
    PublierView, ChangerStatutProduitView,
)

urlpatterns = [
    path("publications/produits/", ListeProduitsView.as_view(), name="liste-produits"),
    path("publications/informations/", ListeInformationsView.as_view(), name="liste-informations"),
    path("publications/publier/", PublierView.as_view(), name="publier-publication"),
    # Le pêcheur active / désactive la disponibilité de son produit
    path(
        "publications/produits/<int:pk>/statut/",
        ChangerStatutProduitView.as_view(),
        name="changer-statut-produit",
    ),
]