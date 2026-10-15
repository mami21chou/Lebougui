-- Création de la base au premier lancement (idempotent)
CREATE DATABASE IF NOT EXISTS lebougui
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
