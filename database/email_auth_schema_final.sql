-- Script de migration pour passer de téléphone à email (Version finale corrigée)
-- À exécuter dans phpMyAdmin

USE localloop;

-- Supprimer les anciennes contraintes et index (sans IF EXISTS)
-- Note: Ces commandes peuvent générer des erreurs si les éléments n'existent pas, c'est normal
ALTER TABLE users DROP INDEX phone;
ALTER TABLE user_sessions DROP FOREIGN KEY fk_user_sessions_user_id;

-- Ajouter les nouvelles colonnes avec des tailles compatibles utf8mb4
ALTER TABLE users 
ADD COLUMN email VARCHAR(191) UNIQUE NOT NULL AFTER id,
ADD COLUMN username VARCHAR(50) UNIQUE NOT NULL AFTER email,
ADD COLUMN avatar_url VARCHAR(500) AFTER username;

-- Supprimer l'ancienne colonne phone
ALTER TABLE users DROP COLUMN phone;

-- Créer les nouveaux index
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Mettre à jour la table conversations pour utiliser username
ALTER TABLE conversations 
ADD COLUMN user_a_username VARCHAR(50) AFTER user_a_id,
ADD COLUMN user_b_username VARCHAR(50) AFTER user_b_id;

-- Mettre à jour la table messages pour utiliser username
ALTER TABLE messages 
ADD COLUMN sender_username VARCHAR(50) AFTER sender_id;

-- Recréer la contrainte de clé étrangère
ALTER TABLE user_sessions 
ADD CONSTRAINT fk_user_sessions_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Fonction pour calculer la distance (si elle n'existe pas)
DELIMITER //
CREATE FUNCTION IF NOT EXISTS calculate_distance(
    lat1 DECIMAL(10, 8),
    lon1 DECIMAL(11, 8),
    lat2 DECIMAL(10, 8),
    lon2 DECIMAL(11, 8)
) RETURNS DECIMAL(10, 2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE distance DECIMAL(10, 2);
    SET distance = (
        6371 * ACOS(
            COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * 
            COS(RADIANS(lon2) - RADIANS(lon1)) + 
            SIN(RADIANS(lat1)) * SIN(RADIANS(lat2))
        )
    );
    RETURN distance;
END//
DELIMITER ;

-- Afficher un message de confirmation
SELECT 'Migration vers email/username terminée avec succès!' AS message;
