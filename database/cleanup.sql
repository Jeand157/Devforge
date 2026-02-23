-- Script de nettoyage pour supprimer les données fictives
-- À exécuter dans phpMyAdmin

USE localloop;

-- Supprimer tous les objets existants
DELETE FROM items;

-- Supprimer tous les utilisateurs existants
DELETE FROM users;

-- Supprimer toutes les conversations
DELETE FROM conversations;

-- Supprimer tous les messages
DELETE FROM messages;

-- Supprimer toutes les sessions
DELETE FROM user_sessions;

-- Supprimer toutes les interactions
DELETE FROM item_interactions;

-- Réinitialiser les compteurs auto-increment
ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE items AUTO_INCREMENT = 1;
ALTER TABLE conversations AUTO_INCREMENT = 1;
ALTER TABLE messages AUTO_INCREMENT = 1;
ALTER TABLE user_sessions AUTO_INCREMENT = 1;
ALTER TABLE item_interactions AUTO_INCREMENT = 1;

-- Afficher un message de confirmation
SELECT 'Base de données nettoyée avec succès!' AS message;
