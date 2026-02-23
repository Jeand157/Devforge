# 🗄️ **GUIDE MODIFICATION BASE DE DONNÉES LOCALLOOP**

## 📋 **Structure Actuelle de la Table `items`**

Votre table `items` contient actuellement **13 champs** :

| # | Champ | Type | Nullable | Défaut | Description |
|---|-------|------|----------|--------|-------------|
| 1 | `id` | char(36) | ❌ | uuid() | Identifiant unique |
| 2 | `title` | varchar(200) | ❌ | - | Titre de l'annonce |
| 3 | `description` | text | ❌ | - | Description détaillée |
| 4 | `latitude` | decimal(10,8) | ❌ | - | Coordonnée latitude |
| 5 | `longitude` | decimal(11,8) | ❌ | - | Coordonnée longitude |
| 6 | `location` | varchar(255) | ✅ | Paris, France | **Localisation textuelle** |
| 7 | `image_url` | text | ✅ | - | URL de l'image |
| 8 | `status` | enum | ❌ | available | Statut (available/reserved/given) |
| 9 | `owner_id` | char(36) | ✅ | - | ID du propriétaire |
| 10 | `owner_name` | varchar(100) | ✅ | - | Nom du propriétaire |
| 11 | `owner_phone` | varchar(20) | ✅ | - | Téléphone du propriétaire |
| 12 | `created_at` | timestamp | ✅ | CURRENT_TIMESTAMP | Date de création |
| 13 | `updated_at` | timestamp | ✅ | CURRENT_TIMESTAMP | Date de modification |

## 🔧 **MÉTHODES POUR MODIFIER LA BASE DE DONNÉES**

### **MÉTHODE 1 : Via phpMyAdmin (Interface Graphique)**

1. **Démarrez WAMP** et ouvrez http://localhost/phpmyadmin
2. **Sélectionnez** la base de données `localloop`
3. **Cliquez** sur l'onglet `SQL`
4. **Exécutez** vos commandes SQL

**Exemples de commandes :**

```sql
-- Ajouter un nouveau champ
ALTER TABLE items ADD COLUMN new_field VARCHAR(100) AFTER location;

-- Modifier un champ existant
ALTER TABLE items MODIFY COLUMN title VARCHAR(300);

-- Supprimer un champ
ALTER TABLE items DROP COLUMN old_field;

-- Renommer un champ
ALTER TABLE items CHANGE old_name new_name VARCHAR(100);
```

### **MÉTHODE 2 : Via Script Node.js (Automatisé)**

Utilisez le script `ajouter-champ-location.js` comme modèle :

```javascript
const mysql = require('mysql2/promise');

async function modifyDatabase() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Mot de passe WAMP
    database: 'localloop'
  });

  // Vos modifications ici
  await connection.execute('ALTER TABLE items ADD COLUMN new_field VARCHAR(100)');
  
  await connection.end();
}
```

### **MÉTHODE 3 : Via Ligne de Commande MySQL**

```bash
# Se connecter à MySQL
mysql -u root -p

# Sélectionner la base de données
USE localloop;

# Exécuter vos commandes
ALTER TABLE items ADD COLUMN new_field VARCHAR(100);
```

## 📊 **STATISTIQUES ACTUELLES**

- **Total d'annonces** : 6
- **Champ location** : ✅ Ajouté et fonctionnel
- **Données existantes** : ✅ Mises à jour avec "Paris, France"

## 🎯 **COMMANDES SQL UTILES**

### **Ajouter un champ**
```sql
ALTER TABLE items ADD COLUMN field_name VARCHAR(255) AFTER existing_field;
```

### **Modifier un champ**
```sql
ALTER TABLE items MODIFY COLUMN field_name VARCHAR(500);
```

### **Supprimer un champ**
```sql
ALTER TABLE items DROP COLUMN field_name;
```

### **Renommer un champ**
```sql
ALTER TABLE items CHANGE old_name new_name VARCHAR(100);
```

### **Ajouter un index**
```sql
ALTER TABLE items ADD INDEX idx_field_name (field_name);
```

### **Vérifier la structure**
```sql
DESCRIBE items;
```

## ⚠️ **PRÉCAUTIONS IMPORTANTES**

1. **Sauvegardez** toujours votre base de données avant modification
2. **Testez** les modifications sur une copie de test
3. **Vérifiez** la compatibilité avec le code backend
4. **Mettez à jour** les interfaces TypeScript si nécessaire

## 🚀 **PROCHAINES ÉTAPES**

Votre base de données est maintenant **complètement fonctionnelle** pour la publication d'annonces avec localisation textuelle !
