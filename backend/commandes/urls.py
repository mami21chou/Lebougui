from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CommandeViewSet, LivraisonViewSet, NoteViewSet, AlerteViewSet,
)

router = DefaultRouter()
router.register(r'commandes', CommandeViewSet, basename='commande')
router.register(r'livraisons', LivraisonViewSet, basename='livraison')
router.register(r'notes', NoteViewSet, basename='note')
router.register(r'alertes', AlerteViewSet, basename='alerte')

urlpatterns = [
    path('', include(router.urls)),
]