from django.urls import path
from .views import (
    AnalyserPublicationView, CreerProduitView, CreerInformationView,
    ListeProduitsView, ListeInformationsView,
    PublierView, ChangerStatutProduitView,
)

urlpatterns = [
    path("publications/analyser/", AnalyserPublicationView.as_view(), name="analyser-publication"),
    path("publications/produits/creer/", CreerProduitView.as_view(), name="creer-produit"),
    path("publications/informations/creer/", CreerInformationView.as_view(), name="creer-information"),
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