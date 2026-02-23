import mysql from 'mysql2/promise';

// Configuration de la base de données MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'localloop',
  charset: 'utf8mb4',
  timezone: '+00:00',
};

// Créer le pool de connexions
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Fonction pour tester la connexion
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connexion à la base de données MySQL réussie');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error);
    return false;
  }
}

// Fonction pour exécuter des requêtes
export async function query(sql: string, params: any[] = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Erreur SQL:', error);
    throw error;
  }
}

// Fonction pour obtenir une connexion
export async function getConnection() {
  return await pool.getConnection();
}

// Fonction pour fermer le pool
export async function closePool() {
  await pool.end();
}

// Types pour les données
export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  avatar_url?: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface Item {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  location: string;
  image_url?: string;
  status: 'available' | 'reserved' | 'given';
  owner_id?: string;
  owner_name?: string;
  owner_phone?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Conversation {
  id: string;
  user_a_id?: string;
  user_b_id?: string;
  user_a_name: string;
  user_b_name: string;
  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id?: string;
  sender_name: string;
  text: string;
  created_at: Date;
}

export interface UserSession {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}

export interface ItemInteraction {
  id: string;
  item_id: string;
  user_id: string;
  interaction_type: 'reserved' | 'taken' | 'contacted';
  created_at: Date;
}

export default pool;
