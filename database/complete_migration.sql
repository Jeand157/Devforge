-- Script pour compléter la migration (conversations et messages)
-- Ce script ajoute les colonnes manquantes dans les autres tables

USE localloop;

-- Vérifier et ajouter les colonnes dans conversations
ALTER TABLE conversations 
ADD COLUMN user_a_username VARCHAR(50) AFTER user_a_id,
ADD COLUMN user_b_username VARCHAR(50) AFTER user_b_id;

-- Vérifier et ajouter la colonne dans messages
ALTER TABLE messages 
ADD COLUMN sender_username VARCHAR(50) AFTER sender_id;

SELECT 'Migration complétée avec succès!' AS message;
