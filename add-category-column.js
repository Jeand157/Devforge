const mysql = require('mysql2/promise');

const config = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'localloop',
};

async function migrate() {
    let connection;
    try {
        console.log('⏳ Connexion à la base de données locale...');
        connection = await mysql.createConnection(config);
        console.log('✅ Connecté !');

        // Vérifier si la colonne existe déjà
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'localloop' 
            AND TABLE_NAME = 'items' 
            AND COLUMN_NAME = 'category'
        `);

        if (columns.length === 0) {
            console.log('⏳ Ajout de la colonne "category" à la table "items"...');
            await connection.query('ALTER TABLE items ADD COLUMN category VARCHAR(100) AFTER image_url');
            console.log('✅ Colonne "category" ajoutée avec succès.');
        } else {
            console.log('ℹ️ La colonne "category" existe déjà.');
        }

        console.log('🎉 Migration terminée !');

    } catch (error) {
        console.error('❌ Erreur lors de la migration :', error);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
