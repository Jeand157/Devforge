-- Script de migration pour passer de téléphone à email (Version corrigée)
-- Ce script supprime l'ancien système de téléphone et ajoute le système email/username

USE localloop;

-- Supprimer les anciennes contraintes et index (sans IF EXISTS)
-- Ces commandes peuvent générer des erreurs si les éléments n'existent pas, c'est normal
ALTER TABLE users DROP INDEX phone;
ALTER TABLE user_sessions DROP FOREIGN KEY fk_user_sessions_user_id;

-- Supprimer l'ancienne colonne phone
ALTER TABLE users DROP COLUMN phone;

-- Ajouter les nouvelles colonnes
ALTER TABLE users 
ADD COLUMN email VARCHAR(191) UNIQUE NOT NULL AFTER id,
ADD COLUMN username VARCHAR(50) UNIQUE NOT NULL AFTER email,
ADD COLUMN avatar_url VARCHAR(500) AFTER username;

-- Créer les nouveaux index
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Mettre à jour la table conversations
ALTER TABLE conversations 
ADD COLUMN user_a_username VARCHAR(50) AFTER user_a_id,
ADD COLUMN user_b_username VARCHAR(50) AFTER user_b_id;

-- Mettre à jour la table messages
ALTER TABLE messages 
ADD COLUMN sender_username VARCHAR(50) AFTER sender_id;

-- Recréer la contrainte de clé étrangère
ALTER TABLE user_sessions 
ADD CONSTRAINT fk_user_sessions_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

SELECT 'Migration terminée avec succès!' AS message;