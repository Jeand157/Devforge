-- Script de vérification de l'état de la migration
-- Ce script vérifie quelles colonnes existent déjà

USE localloop;

-- Vérifier la structure de la table users
DESCRIBE users;

-- Vérifier la structure de la table conversations
DESCRIBE conversations;

-- Vérifier la structure de la table messages
DESCRIBE messages;

-- Vérifier les index sur la table users
SHOW INDEX FROM users;

SELECT 'Vérification terminée!' AS message;
