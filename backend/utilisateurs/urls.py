from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    ConnexionView, InscriptionView, ProfilMeView,
    SouscrirePremiumView, ToggleDisponibleView,
)

urlpatterns = [
    path("auth/inscription/", InscriptionView.as_view(), name="inscription"),
    path("auth/connexion/", ConnexionView.as_view(), name="connexion"),
    path("auth/me/", ProfilMeView.as_view(), name="monprofil"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token"),
    path("premium/souscrire/", SouscrirePremiumView.as_view(), name="souscrire-premium"),
    path("livreur/disponible/", ToggleDisponibleView.as_view(), name="toggle-disponible"),
]