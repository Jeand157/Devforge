-- Script de migration SIMPLE (sans DROP problématiques)
-- Ce script ajoute le système email/username sans supprimer l'ancien

USE localloop;

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

SELECT 'Migration terminée avec succès!' AS message;
