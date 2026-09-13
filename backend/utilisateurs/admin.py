# from django.contrib import admin
# from django.contrib.auth.admin import UserAdmin
# from .models import Utilisateur, ProfilLivreur, Premium, ProfilPecheur, Vehicule

# # Register your models here.
# @admin.register(Utilisateur)
# class UtilisateurAdmin(UserAdmin):
#     list_display = ("email", "telephone", "nom", "prenom", "role", "is_active")
#     list_filter = ("role", "is_active", "is_staff")
#     search_fields = ("email", "telephone", "nom", "prenom")
#     ordering = ("nom",)
#     fieldsets = (
#         (None, {"fields": ("email", "password")}),
#         ("Identité", {"fields": ("nom", "prenom", "telephone", "adresse")}),
#         ("Rôle", {"fields": ("role",)}),
#         ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser",
#                                      "groups", "user_permissions")}),
#     )

#     add_fieldsets = (
#         (None, {
#             "classes": ("wide",),
#             "fields": ("email", "nom", "prenom", "telephone", "role",
#                        "password1", "password2"),
#         }),
#     )


# admin.site.register(ProfilPecheur)
# admin.site.register(ProfilLivreur)
# admin.site.register(Premium)
# admin.site.register(Vehicule)