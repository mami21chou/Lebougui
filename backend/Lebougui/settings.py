"""
Django settings for Lebougui project.

Configuration 12-factor :
    - Toutes les valeurs sensibles ou contextuelles viennent de l'environnement.
    - Le fichier .env local est chargé en dev pour le confort.
    - En Docker/K8s, les variables sont injectées directement.
"""

import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

# ═══════════════════════════════════════════════════════════
# BASE
# ═══════════════════════════════════════════════════════════
BASE_DIR = Path(__file__).resolve().parent.parent

# Charge backend/.env si présent (dev local uniquement).
# En Docker, les variables d'env sont injectées par le compose.
load_dotenv(os.path.join(BASE_DIR, '.env'))


# ═══════════════════════════════════════════════════════════
# AIDE : lecture typée des variables d'environnement
# ═══════════════════════════════════════════════════════════
def env_str(key: str, default: str = '') -> str:
    return os.getenv(key, default)


def env_bool(key: str, default: bool = False) -> bool:
    return os.getenv(key, str(default)).lower() in ('true', '1', 'yes', 'on')


def env_list(key: str, default: str = '', sep: str = ',') -> list[str]:
    raw = os.getenv(key, default)
    return [item.strip() for item in raw.split(sep) if item.strip()]


# ═══════════════════════════════════════════════════════════
# SÉCURITÉ
# ═══════════════════════════════════════════════════════════
SECRET_KEY = env_str(
    'DJANGO_SECRET_KEY',
    'django-insecure-fallback-dev-only-change-me-in-prod'
)
DEBUG = env_bool('DJANGO_DEBUG', default=True)

ALLOWED_HOSTS = env_list(
    'DJANGO_ALLOWED_HOSTS',
    'localhost,127.0.0.1,.ngrok-free.dev,.ngrok.io'
)

USE_X_FORWARDED_HOST = True
# ═══════════════════════════════════════════════════════════
# APPS
# ═══════════════════════════════════════════════════════════
INSTALLED_APPS = [
    'corsheaders',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'commandes',
    'publications',
    'utilisateurs',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'Lebougui.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'Lebougui.wsgi.application'


# ═══════════════════════════════════════════════════════════
# BASE DE DONNÉES
# ═══════════════════════════════════════════════════════════
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': env_str('DB_NAME'),
        'USER': env_str('DB_USER'),
        'PASSWORD': env_str('DB_PASSWORD'),
        'HOST': env_str('DB_HOST', 'localhost'),
        'PORT': env_str('DB_PORT', '3306'),
        'OPTIONS': {'charset': 'utf8mb4'},
    }
}


# ═══════════════════════════════════════════════════════════
# MOTS DE PASSE
# ═══════════════════════════════════════════════════════════
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# ═══════════════════════════════════════════════════════════
# I18N
# ═══════════════════════════════════════════════════════════
LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Africa/Dakar'
USE_I18N = True
USE_TZ = True


# ═══════════════════════════════════════════════════════════
# FICHIERS STATIQUES & MEDIA
# ═══════════════════════════════════════════════════════════
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# ═══════════════════════════════════════════════════════════
# AUTHENTIFICATION
# ═══════════════════════════════════════════════════════════
AUTH_USER_MODEL = 'utilisateurs.Utilisateur'

AUTHENTICATION_BACKENDS = [
    'utilisateurs.backends.HybridAuthBackend',
    'django.contrib.auth.backends.ModelBackend',
]


# ═══════════════════════════════════════════════════════════
# REST FRAMEWORK + JWT
# ═══════════════════════════════════════════════════════════
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
}


# ═══════════════════════════════════════════════════════════
# CORS / CSRF
# ═══════════════════════════════════════════════════════════
CORS_ALLOWED_ORIGINS = env_list(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:5173,http://127.0.0.1:5173,'
    'http://localhost:5174,http://127.0.0.1:5174,'
    'http://localhost:8080,http://127.0.0.1:8080'
)

CSRF_TRUSTED_ORIGINS = env_list(
    'CSRF_TRUSTED_ORIGINS',
    'http://localhost:5173,http://127.0.0.1:5173,'
    'http://localhost:5174,http://127.0.0.1:5174,'
    'http://localhost:8080,http://127.0.0.1:8080,'
    'https://*.ngrok-free.dev,https://*.ngrok.io'
)


# ═══════════════════════════════════════════════════════════
# EMAIL (dev)
# ═══════════════════════════════════════════════════════════
MAILERS = {
    'default': {
        'BACKEND': 'django.core.mail.backends.console.EmailBackend',
    },
}


# ═══════════════════════════════════════════════════════════
# IA (microservice FastAPI)
# ═══════════════════════════════════════════════════════════
IA_SERVICE_URL = env_str('IA_SERVICE_URL', 'http://127.0.0.1:8001')

