"""
Rôle : Backend d'authentification hybride.
       - Admin    : email + mot de passe
       - Autres   : téléphone + code PIN
"""

from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

# Bonne pratique Django : récupérer le modèle utilisateur actif via AUTH_USER_MODEL
Utilisateur = get_user_model()


# =========================================================
# BACKEND D'AUTHENTIFICATION HYBRIDE
# =========================================================

class HybridAuthBackend(ModelBackend):
    """
    Backend d'authentification personnalisé.
    Surcharge uniquement la méthode `authenticate` de ModelBackend
    pour supporter deux modes de connexion selon le rôle de l'utilisateur.
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        """
        Appelée par `django.contrib.auth.authenticate`.
        Retourne l'utilisateur si les identifiants sont valides, sinon None.

        `username` peut contenir :
        - un email    → connexion admin
        - un téléphone → connexion pêcheur / acheteur / livreur
        """
        # Récupère l'identifiant quel que soit le nom du paramètre transmis
        identifiant = username or kwargs.get('telephone') or kwargs.get('email')

        # Champs obligatoires manquants → échec silencieux
        if not identifiant or not password:
            return None

        try:
            # ─── Cas 1 : Administrateur (email) ───
            if "@" in identifiant:
                user = Utilisateur.objects.get(
                    email=identifiant,
                    role=Utilisateur.Role.ADMIN,
                )

            # ─── Cas 2 : Pêcheur / Acheteur / Livreur (téléphone) ───
            else:
                user = Utilisateur.objects.get(telephone=identifiant)

                # Un admin ne peut PAS se connecter via son téléphone
                if user.role == Utilisateur.Role.ADMIN:
                    return None

            # ─── Vérification finale du mot de passe + compte actif ───
            if user.check_password(password) and self.user_can_authenticate(user):
                return user

        except Utilisateur.DoesNotExist:
            # Utilisateur introuvable → échec silencieux
            return None

        # Aucun cas valide → échec
        return None