-- LocalLoop Database Schema for MySQL/MariaDB (WampServer)
-- Database Creation Script

-- Create database
CREATE DATABASE IF NOT EXISTS localloop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
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
    category VARCHAR(100),
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

-- User sessions/tokens table
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

-- Insert sample data for testing
INSERT INTO users (id, name, phone, password_hash) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'Admin LocalLoop', '+33123456789', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'),
('550e8400-e29b-41d4-a716-446655440002', 'Marie Dupont', '+33987654321', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'),
('550e8400-e29b-41d4-a716-446655440003', 'Jean Martin', '+33555666777', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');

-- Insert sample items (Paris area)
INSERT INTO items (id, title, description, latitude, longitude, image_url, status, owner_name, owner_phone) VALUES 
('660e8400-e29b-41d4-a716-446655440001', 'Vélo vintage', 'Vélo vintage en bon état, parfait pour se déplacer en ville', 48.8566, 2.3522, 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400', 'available', 'Marie Dupont', '+33987654321'),
('660e8400-e29b-41d4-a716-446655440002', 'Livres de cuisine', 'Collection de livres de cuisine française, très bien conservés', 48.8606, 2.3376, 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400', 'available', 'Jean Martin', '+33555666777'),
('660e8400-e29b-41d4-a716-446655440003', 'Table basse en bois', 'Table basse en bois massif, quelques rayures mais solide', 48.8526, 2.3662, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400', 'available', 'Marie Dupont', '+33987654321'),
('660e8400-e29b-41d4-a716-446655440004', 'Lampes de bureau', 'Paire de lampes de bureau LED, très économe en énergie', 48.8446, 2.3452, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'reserved', 'Jean Martin', '+33555666777'),
('660e8400-e29b-41d4-a716-446655440005', 'Chaise de bureau ergonomique', 'Chaise de bureau avec support lombaire, très confortable', 48.8686, 2.3222, 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400', 'available', 'Marie Dupont', '+33987654321');

-- Grant permissions (adjust username as needed)
-- GRANT ALL PRIVILEGES ON localloop.* TO 'localloop_user'@'localhost' IDENTIFIED BY 'localloop_password';
-- FLUSH PRIVILEGES;
