-- LocalLoop Database Schema
-- PostgreSQL Database Creation Script

-- Create database (run this as superuser)
-- CREATE DATABASE localloop;
-- \c localloop;

-- Enable PostGIS extension for geospatial data
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Items table with PostGIS geometry
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    location GEOMETRY(POINT, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) STORED,
    image_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'given')),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    owner_name VARCHAR(100),
    owner_phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_b_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_a_name VARCHAR(100) NOT NULL,
    user_b_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_a_id, user_b_id)
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sender_name VARCHAR(100) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User sessions/tokens table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Item interactions (for tracking who reserved/took items)
CREATE TABLE item_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('reserved', 'taken', 'contacted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_items_location ON items USING GIST (location);
CREATE INDEX idx_items_status ON items (status);
CREATE INDEX idx_items_owner ON items (owner_id);
CREATE INDEX idx_items_created_at ON items (created_at);

CREATE INDEX idx_messages_conversation ON messages (conversation_id);
CREATE INDEX idx_messages_created_at ON messages (created_at);

CREATE INDEX idx_conversations_users ON conversations (user_a_id, user_b_id);

CREATE INDEX idx_user_sessions_token ON user_sessions (token);
CREATE INDEX idx_user_sessions_user ON user_sessions (user_id);
CREATE INDEX idx_user_sessions_expires ON user_sessions (expires_at);

CREATE INDEX idx_item_interactions_item ON item_interactions (item_id);
CREATE INDEX idx_item_interactions_user ON item_interactions (user_id);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to find nearby items using PostGIS
CREATE OR REPLACE FUNCTION find_nearby_items(
    lat DECIMAL(10, 8),
    lon DECIMAL(11, 8),
    radius_km INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(200),
    description TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    image_url TEXT,
    status VARCHAR(20),
    owner_name VARCHAR(100),
    owner_phone VARCHAR(20),
    distance_km DECIMAL
) AS $$
BEGIN
    RETURN QUERY
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
        ST_Distance(
            i.location,
            ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography
        ) / 1000.0 as distance_km
    FROM items i
    WHERE ST_DWithin(
        i.location,
        ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography,
        radius_km * 1000
    )
    ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE (
    donated_count BIGINT,
    reserved_count BIGINT,
    total_items BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(CASE WHEN i.status = 'given' THEN 1 END) as donated_count,
        COUNT(CASE WHEN i.status = 'reserved' THEN 1 END) as reserved_count,
        COUNT(*) as total_items
    FROM items i
    WHERE i.owner_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data (optional - for testing)
INSERT INTO users (name, phone, password_hash) VALUES 
('Admin LocalLoop', '+33123456789', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'),
('Marie Dupont', '+33987654321', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'),
('Jean Martin', '+33555666777', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');

-- Insert sample items
INSERT INTO items (title, description, latitude, longitude, image_url, status, owner_name, owner_phone) VALUES 
('Vélo vintage', 'Vélo vintage en bon état, parfait pour se déplacer en ville', 48.8566, 2.3522, 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400', 'available', 'Marie Dupont', '+33987654321'),
('Livres de cuisine', 'Collection de livres de cuisine française, très bien conservés', 48.8606, 2.3376, 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400', 'available', 'Jean Martin', '+33555666777'),
('Table basse en bois', 'Table basse en bois massif, quelques rayures mais solide', 48.8526, 2.3662, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400', 'available', 'Marie Dupont', '+33987654321'),
('Lampes de bureau', 'Paire de lampes de bureau LED, très économe en énergie', 48.8446, 2.3452, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'reserved', 'Jean Martin', '+33555666777'),
('Chaise de bureau ergonomique', 'Chaise de bureau avec support lombaire, très confortable', 48.8686, 2.3222, 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400', 'available', 'Marie Dupont', '+33987654321');

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO localloop_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO localloop_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO localloop_user;
