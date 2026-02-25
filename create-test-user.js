const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const config = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'localloop',
};

async function seed() {
    let connection;
    try {
        console.log('⏳ Connexion à la base de données...');
        connection = await mysql.createConnection(config);

        const testUser = {
            id: '9a8616d9-a357-11f0-b9a5-0a0027000026', // ID trouvé dans les sessions
            name: 'Utilisateur Test',
            email: 'test@example.com',
            username: 'testuser',
            password: 'password123'
        };

        const passwordHash = await bcrypt.hash(testUser.password, 10);

        console.log(`⏳ Création de l'utilisateur ${testUser.username}...`);

        // Supprimer si existe déjà pour éviter les doublons avec cet ID spécifique
        await connection.query('DELETE FROM users WHERE id = ? OR email = ?', [testUser.id, testUser.email]);

        await connection.query(
            'INSERT INTO users (id, name, email, username, password_hash) VALUES (?, ?, ?, ?, ?)',
            [testUser.id, testUser.name, testUser.email, testUser.username, passwordHash]
        );

        console.log('✅ Utilisateur créé avec succès !');
        console.log('--- Identifiants ---');
        console.log(`Email: ${testUser.email}`);
        console.log(`Password: ${testUser.password}`);
        console.log('--------------------');
        console.log('Note: Cet utilisateur correspond à une session existante dans votre base.');

    } catch (error) {
        console.error('❌ Erreur :', error);
    } finally {
        if (connection) await connection.end();
    }
}

seed();
