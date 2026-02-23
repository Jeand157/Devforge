-- Script de correction pour la base de données LocalLoop
-- Supprime et recrée la base avec le schéma corrigé

-- Supprimer la base existante si elle existe
DROP DATABASE IF EXISTS localloop;

-- Créer la base de données
CREATE DATABASE localloop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE localloop;

-- Users table
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Items table with spatial data
CREATE TABLE items (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    image_url TEXT,
    status ENUM('available', 'reserved', 'given') NOT NULL DEFAULT 'available',
    owner_id CHAR(36),
    owner_name VARCHAR(100),
    owner_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_owner_id (owner_id),
    INDEX idx_status (status),
    INDEX idx_location (latitude, longitude),
    INDEX idx_created_at (created_at)
);

-- Conversations table
CREATE TABLE conversations (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_a_id CHAR(36),
    user_b_id CHAR(36),
    user_a_name VARCHAR(100) NOT NULL,
    user_b_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_conversation (user_a_id, user_b_id),
    INDEX idx_user_a (user_a_id),
    INDEX idx_user_b (user_b_id)
);

-- Messages table
CREATE TABLE messages (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    conversation_id CHAR(36) NOT NULL,
    sender_id CHAR(36),
    sender_name VARCHAR(100) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_conversation (conversation_id),
    INDEX idx_sender (sender_id),
    INDEX idx_created_at (created_at)
);

-- User sessions/tokens table (CORRIGÉ - token VARCHAR(191))
CREATE TABLE user_sessions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    token VARCHAR(191) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at)
);

-- Item interactions table
CREATE TABLE item_interactions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    item_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    interaction_type ENUM('reserved', 'taken', 'contacted') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_item_id (item_id),
    INDEX idx_user_id (user_id),
    INDEX idx_type (interaction_type)
);

-- Create function to calculate distance between two points (Haversine formula)
DELIMITER //
CREATE FUNCTION calculate_distance(
    lat1 DECIMAL(10, 8),
    lon1 DECIMAL(11, 8),
    lat2 DECIMAL(10, 8),
    lon2 DECIMAL(11, 8)
) RETURNS DECIMAL(10, 2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE distance DECIMAL(10, 2);
    DECLARE earth_radius DECIMAL(10, 2) DEFAULT 6371;
    DECLARE dlat DECIMAL(10, 8);
    DECLARE dlon DECIMAL(11, 8);
    DECLARE a DECIMAL(20, 10);
    DECLARE c DECIMAL(20, 10);
    
    SET dlat = RADIANS(lat2 - lat1);
    SET dlon = RADIANS(lon2 - lon1);
    SET a = SIN(dlat/2) * SIN(dlat/2) + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dlon/2) * SIN(dlon/2);
    SET c = 2 * ATAN2(SQRT(a), SQRT(1-a));
    SET distance = earth_radius * c;
    
    RETURN distance;
END//
DELIMITER ;

-- Create stored procedure to find nearby items
DELIMITER //
CREATE PROCEDURE find_nearby_items(
    IN p_lat DECIMAL(10, 8),
    IN p_lon DECIMAL(11, 8),
    IN p_radius_km INT
)
BEGIN
    SELECT 
        i.id,
        i.title,
        i.description,
        i.latitude,
        i.longitude,
        i.image_url,
        i.status,
        i.owner_name,
        i.owner_phone,
        calculate_distance(p_lat, p_lon, i.latitude, i.longitude) AS distance_km
    FROM items i
    WHERE calculate_distance(p_lat, p_lon, i.latitude, i.longitude) <= p_radius_km
    ORDER BY distance_km;
END//
DELIMITER ;

-- Create stored procedure to get user statistics
DELIMITER //
CREATE PROCEDURE get_user_stats(IN p_user_id CHAR(36))
BEGIN
    SELECT 
        COUNT(CASE WHEN status = 'given' THEN 1 END) AS donated_count,
        COUNT(CASE WHEN status = 'reserved' THEN 1 END) AS reserved_count,
        COUNT(*) AS total_items
    FROM items 
    WHERE owner_id = p_user_id;
END//
DELIMITER ;

-- Base de données prête pour les vrais utilisateurs
-- Les utilisateurs et objets seront créés par les utilisateurs réels

-- Afficher un message de succès
SELECT 'Base de données LocalLoop créée avec succès!' AS message;
