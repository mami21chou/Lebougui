from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

Utilisateur=get_user_model()

class HybridAuthBackend(ModelBackend):
    """
    Backend permettant la connexion :
    - Par EMAIL + PASSWORD pour les Administrateurs.
    - Par TÉLÉPHONE + CODE PIN pour les autres utilisateurs (Pêcheur, Acheteur, Livreur).
    """

    def authenticate(self, request, username = None, password = None, **kwargs):
        identifiant= username or kwargs.get('telephone') or kwargs.get('email')        # Le champ 'username' peut recevoir soit un email, soit un numéro de téléphone
        if not identifiant or not password:
            return None
        try:
            # Cas 1 : Connexion Administrateur via Email
            if "@" in identifiant:
                user = Utilisateur.objects.get(
                    email=identifiant, role=Utilisateur.Role.ADMIN
                )

            # Cas 2 : Connexion Utilisateur (Pêcheur, Acheteur, Livreur) via Téléphone
            else:
                user = Utilisateur.objects.get(telephone=identifiant)

                # Bloque la connexion par téléphone si l'utilisateur possède le rôle ADMIN
                if user.role == Utilisateur.Role.ADMIN:
                    return None

            # Vérification du mot de passe / code PIN haché
            if user.check_password(password) and self.user_can_authenticate(user):
                return user

        except Utilisateur.DoesNotExist:
            return None

        return None
