const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Configuration - Attempt to load from apps/backend/.env
require('dotenv').config({ path: path.join(__dirname, 'apps', 'backend', '.env') });

const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'localloop',
};

async function setup() {
    let connection;
    try {
        console.log('🚀 Démarrage de la configuration LocalLoop...');

        // 1. Connexion initiale (sans base)
        console.log(`⏳ Connexion à MySQL (${config.host})...`);
        const initialConn = await mysql.createConnection({
            host: config.host,
            user: config.user,
            password: config.password,
            port: config.port
        });

        // 2. Création de la base de données
        console.log(`⏳ Vérification de la base de données "${config.database}"...`);
        await initialConn.query(`CREATE DATABASE IF NOT EXISTS ${config.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await initialConn.end();
        console.log('✅ Base de données prête.');

        // 3. Reconnexion à la base
        connection = await mysql.createConnection({ ...config, multipleStatements: true });

        // 4. Harmonisation du schéma
        console.log('⏳ Vérification et harmonisation du schéma...');

        async function columnExists(table, column) {
            const [rows] = await connection.query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = ? 
                AND TABLE_NAME = ? 
                AND COLUMN_NAME = ?
            `, [config.database, table, column]);
            return rows.length > 0;
        }

        // Table Users
        console.log('  - Vérification table "users"...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id CHAR(36) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(191) UNIQUE NOT NULL,
                username VARCHAR(100) UNIQUE NOT NULL,
                avatar_url TEXT,
                phone VARCHAR(20) UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        if (!await columnExists('users', 'email')) {
            await connection.query('ALTER TABLE users ADD COLUMN email VARCHAR(191) NOT NULL UNIQUE AFTER name');
        }
        if (!await columnExists('users', 'username')) {
            await connection.query('ALTER TABLE users ADD COLUMN username VARCHAR(100) NOT NULL UNIQUE AFTER email');
        }
        if (!await columnExists('users', 'avatar_url')) {
            await connection.query('ALTER TABLE users ADD COLUMN avatar_url TEXT AFTER username');
        }

        // Table Items
        console.log('  - Vérification table "items"...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS items (
                id CHAR(36) PRIMARY KEY,
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
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        if (!await columnExists('items', 'category')) {
            await connection.query('ALTER TABLE items ADD COLUMN category VARCHAR(100) AFTER image_url');
        }

        // Table Conversations
        console.log('  - Vérification table "conversations"...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS conversations (
                id CHAR(36) PRIMARY KEY,
                user_a_id CHAR(36),
                user_b_id CHAR(36),
                user_a_name VARCHAR(100) NOT NULL,
                user_b_name VARCHAR(100) NOT NULL,
                user_a_username VARCHAR(100),
                user_b_username VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_conversation (user_a_id, user_b_id)
            )
        `);

        if (!await columnExists('conversations', 'user_a_username')) {
            await connection.query('ALTER TABLE conversations ADD COLUMN user_a_username VARCHAR(100) AFTER user_b_name');
        }
        if (!await columnExists('conversations', 'user_b_username')) {
            await connection.query('ALTER TABLE conversations ADD COLUMN user_b_username VARCHAR(100) AFTER user_a_username');
        }

        // Table Messages
        console.log('  - Vérification table "messages"...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id CHAR(36) PRIMARY KEY,
                conversation_id CHAR(36) NOT NULL,
                sender_id CHAR(36),
                sender_name VARCHAR(100) NOT NULL,
                sender_username VARCHAR(100),
                text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        if (!await columnExists('messages', 'sender_username')) {
            await connection.query('ALTER TABLE messages ADD COLUMN sender_username VARCHAR(100) AFTER sender_name');
        }

        // Tables annexes
        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_sessions (
                id CHAR(36) PRIMARY KEY,
                user_id CHAR(36) NOT NULL,
                token VARCHAR(191) UNIQUE NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_conversation_reads (
                user_id CHAR(36) NOT NULL,
                conversation_id CHAR(36) NOT NULL,
                last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, conversation_id)
            )
        `);

        console.log('✅ Schéma harmonisé.');

        // 5. Création de l'utilisateur de test
        console.log('⏳ Création de l\'utilisateur test...');
        const testUser = {
            id: '9a8616d9-a357-11f0-b9a5-0a0027000026',
            name: 'Utilisateur Test',
            email: 'test@example.com',
            username: 'testuser',
            password: 'password123'
        };
        const hash = await bcrypt.hash(testUser.password, 10);

        await connection.query('DELETE FROM users WHERE id = ? OR email = ?', [testUser.id, testUser.email]);
        await connection.query(
            'INSERT INTO users (id, name, email, username, password_hash) VALUES (?, ?, ?, ?, ?)',
            [testUser.id, testUser.name, testUser.email, testUser.username, hash]
        );
        console.log('✅ Utilisateur test prêt (test@example.com / password123).');

        console.log('🎉 Configuration réussie !');
        console.log('Vous pouvez maintenant démarrer le backend et le frontend.');

    } catch (error) {
        console.error('❌ Erreur lors de la configuration :', error);
    } finally {
        if (connection) await connection.end();
    }
}

setup();
