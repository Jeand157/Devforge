import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import bcrypt from 'bcryptjs';
import { query, testConnection, User, Item, Conversation, Message } from './database';
import { queries } from './queries';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Test de connexion à la base de données
testConnection().then(connected => {
  if (connected) {
    console.log('✅ Connexion à la base de données réussie');
  } else {
    console.log('❌ Échec de la connexion à la base de données');
  }
});

// Authentification par token
async function authUser(req: express.Request): Promise<User | null> {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) return null;

    const sessions = await query(queries.getSessionByToken, [token]) as any[];
    if (sessions.length === 0) return null;

    const session = sessions[0];
    const users = await query(queries.getUserById, [session.user_id]) as User[];
    return users[0] || null;
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    return null;
  }
}

// Routes API

// Inscription avec email
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, username, password } = req.body;

    if (!name || !email || !username || !password) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    // Vérifier si l'email existe déjà
    const existingEmail = await query(queries.getUserByEmail, [email]) as User[];
    if (existingEmail.length > 0) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Vérifier si le nom d'utilisateur existe déjà
    const existingUsername = await query(queries.getUserByUsername, [username]) as User[];
    if (existingUsername.length > 0) {
      return res.status(400).json({ error: 'Ce nom d\'utilisateur est déjà utilisé' });
    }

    // Hacher le mot de passe
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Créer l'utilisateur
    await query(queries.createUser, [name, email, username, null, passwordHash]);

    // Récupérer l'utilisateur créé
    const newUser = await query(queries.getUserByEmail, [email]) as User[];
    const user = newUser[0];

    // Créer une session
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    await query(queries.createSession, [user.id, token]);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        avatar_url: user.avatar_url
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Connexion avec email
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    // Récupérer l'utilisateur par email
    const users = await query(queries.getUserByEmail, [email]) as User[];
    if (users.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const user = users[0];

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Créer une session
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    await query(queries.createSession, [user.id, token]);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        avatar_url: user.avatar_url
      }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Déconnexion
app.post('/api/auth/logout', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';

    if (token) {
      await query(queries.deleteSession, [token]);
    }

    res.json({ message: 'Déconnexion réussie' });
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Obtenir les informations de l'utilisateur connecté
app.get('/api/users/me', async (req, res) => {
  try {
    const user = await authUser(req);
    if (!user) return res.status(401).json({ error: 'Non autorisé' });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      avatar_url: user.avatar_url
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Obtenir les statistiques de l'utilisateur
app.get('/api/users/me/stats', async (req, res) => {
  try {
    const user = await authUser(req);
    if (!user) return res.status(401).json({ error: 'Non autorisé' });

    // Compter les objets publiés par l'utilisateur
    const publishedItems = await query(`
      SELECT COUNT(*) as count FROM items WHERE owner_id = ?
    `, [user.id]) as any[];

    // Compter les objets réservés PAR cet utilisateur (interactions)
    const reservedByUser = await query(`
      SELECT COUNT(*) as count FROM item_interactions 
      WHERE user_id = ? AND interaction_type = 'reserved'
    `, [user.id]) as any[];

    // Compter les conversations (user_a OU user_b)
    const conversations = await query(`
      SELECT COUNT(*) as count FROM conversations WHERE user_a_id = ? OR user_b_id = ?
    `, [user.id, user.id]) as any[];

    // Date d'inscription
    const joinDate = user.created_at || new Date().toISOString();

    res.json({
      published_items: publishedItems[0]?.count || 0,
      reserved_items: reservedByUser[0]?.count || 0,
      total_conversations: conversations[0]?.count || 0,
      rating: 5.0, // Note par défaut
      join_date: joinDate
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Rechercher des utilisateurs pour le chat
app.get('/api/users/search', async (req, res) => {
  try {
    const user = await authUser(req);
    if (!user) return res.status(401).json({ error: 'Non autorisé' });

    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Paramètre de recherche requis' });
    }

    const searchTerm = `%${q}%`;
    const users = await query(queries.searchUsers, [searchTerm, searchTerm, user.id]) as any[];

    res.json(users);
  } catch (error) {
    console.error('Erreur lors de la recherche d\'utilisateurs:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Obtenir les objets
app.get('/api/items', async (req, res) => {
  try {
    const { lat, lon, radius = 10 } = req.query;

    if (lat && lon) {
      const items = await query(queries.getItemsNearby, [lat, lon, lat, lon, radius]) as any[];
      res.json(items);
    } else {
      // Récupérer tous les objets si pas de géolocalisation
      const items = await query(`
        SELECT i.*, u.name AS owner_name, u.username AS owner_username, u.email AS owner_email
        FROM items i 
        JOIN users u ON i.owner_id = u.id 
        ORDER BY i.created_at DESC
      `) as any[];
      res.json(items);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des objets:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Créer un objet
app.post('/api/items', async (req, res) => {
  try {
    const user = await authUser(req);
    if (!user) return res.status(401).json({ error: 'Non autorisé' });

    const { title, description, imageUrl, latitude, longitude, location } = req.body;

    if (!title || !description || !latitude || !longitude || !location) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    await query(queries.createItem, [title, description, latitude, longitude, location, imageUrl, user.id]);

    res.json({ message: 'Objet créé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la création de l\'objet:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Récupérer un objet par ID
app.get('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await query(queries.getItemById, [id]) as any[];

    if (item.length === 0) {
      return res.status(404).json({ error: 'Objet non trouvé' });
    }

    res.json(item[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'objet:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Réserver un objet
app.post('/api/items/:id/reserve', async (req, res) => {
  try {
    const user = await authUser(req);
    if (!user) return res.status(401).json({ error: 'Non autorisé' });

    const { id } = req.params;

    // Vérifier que l'objet existe et est disponible
    const item = await query(queries.getItemById, [id]) as any[];
    if (item.length === 0) {
      return res.status(404).json({ error: 'Objet non trouvé' });
    }

    if (item[0].status !== 'available') {
      return res.status(400).json({ error: 'Cet objet n\'est plus disponible' });
    }

    if (item[0].owner_id === user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas réserver votre propre objet' });
    }

    // Mettre à jour le statut
    await query(queries.updateItemStatus, ['reserved', id]);

    res.json({ message: 'Objet réservé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la réservation:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Mettre à jour le statut d'un objet
app.post('/api/items/:id/status', async (req, res) => {
  try {
    const user = await authUser(req);
    if (!user) return res.status(401).json({ error: 'Non autorisé' });

    const { id } = req.params;
    const { status } = req.body;

    if (!['available', 'reserved', 'given'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    await query(queries.updateItemStatus, [status, id]);

    res.json({ message: 'Statut mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// API Chat - Créer ou récupérer une conversation
app.post('/api/conversations', async (req, res) => {
  try {
    const user = await authUser(req);
    if (!user) return res.status(401).json({ error: 'Non autorisé' });

    const { otherUserId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({ error: 'ID de l\'autre utilisateur requis' });
    }

    // Vérifier si une conversation existe déjà
    const existingConversations = await query(queries.getConversationByUsers, [
      user.id, otherUserId, otherUserId, user.id
    ]) as Conversation[];

    if (existingConversations.length > 0) {
      return res.json(existingConversations[0]);
    }

    // Récupérer les informations de l'autre utilisateur
    const otherUsers = await query(queries.getUserById, [otherUserId]) as User[];
    if (otherUsers.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const otherUser = otherUsers[0];

    // Créer une nouvelle conversation
    await query(queries.createConversation, [
      user.id, otherUserId, user.name, otherUser.name, user.username, otherUser.username
    ]);

    // Récupérer la conversation créée
    const newConversations = await query(queries.getConversationByUsers, [
      user.id, otherUserId, otherUserId, user.id
    ]) as Conversation[];

    res.json(newConversations[0]);
  } catch (error) {
    console.error('Erreur lors de la création de la conversation:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Obtenir les conversations de l'utilisateur
app.get('/api/conversations', async (req, res) => {
  try {
    const user = await authUser(req);
    if (!user) return res.status(401).json({ error: 'Non autorisé' });

    const conversations = await query(queries.getUserConversations, [
      user.id, user.id, user.id, user.id, user.id
    ]) as any[];

    res.json(conversations);
  } catch (error) {
    console.error('Erreur lors de la récupération des conversations:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});


// Obtenir une conversation par ID
app.get('/api/conversations/:id', async (req, res) => {
  try {
    const user = await authUser(req);
    if (!user) return res.status(401).json({ error: 'Non autorisé' });

    const { id } = req.params;
    const conversations = await query(queries.getConversationById, [id]) as Conversation[];

    if (conversations.length === 0) {
      return res.status(404).json({ error: 'Conversation non trouvée' });
    }

    const conversation = conversations[0];
    if (conversation.user_a_id !== user.id && conversation.user_b_id !== user.id) {
      return res.status(403).json({ error: 'Accès non autorisé à cette conversation' });
    }

    res.json(conversation);
  } catch (error) {
    console.error('Erreur lors de la récupération de la conversation:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Obtenir les messages d'une conversation
app.get('/api/conversations/:id/messages', async (req, res) => {
  try {
    const user = await authUser(req);
    if (!user) return res.status(401).json({ error: 'Non autorisé' });

    const { id } = req.params;
    const messages = await query(queries.getMessagesByConversation, [id]) as Message[];

    res.json(messages);
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Créer un message
app.post('/api/conversations/:id/messages', async (req, res) => {
  try {
    const user = await authUser(req);
    if (!user) return res.status(401).json({ error: 'Non autorisé' });

    const { id } = req.params;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Le message ne peut pas être vide' });
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    const conversations = await query(queries.getConversationById, [id]) as Conversation[];
    if (conversations.length === 0) {
      return res.status(404).json({ error: 'Conversation non trouvée' });
    }

    const conversation = conversations[0];
    if (conversation.user_a_id !== user.id && conversation.user_b_id !== user.id) {
      return res.status(403).json({ error: 'Accès non autorisé à cette conversation' });
    }

    // Créer le message
    await query(queries.createMessage, [id, user.id, user.name, user.username, text.trim()]);

    res.json({ message: 'Message envoyé avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Obtenir les annonces de l'utilisateur connecté
app.get('/api/items/my', async (req, res) => {
  try {
    const user = await authUser(req);
    if (!user) return res.status(401).json({ error: 'Non autorisé' });

    // On récupère d'abord les objets appartenant à l'utilisateur
    const items = await query(`
      SELECT * FROM items 
      WHERE owner_id = ?
      ORDER BY created_at DESC
    `, [user.id]) as any[];

    console.log(`[DEBUG] /api/items/my - User: ${user.id} - Raw items found: ${items.length}`);

    // On remplit avec les infos de l'utilisateur authentifié (puisqu'on sait que c'est le propriétaire)
    const itemsWithInfo = items.map(item => ({
      ...item,
      owner_name: user.name,
      owner_username: user.username,
      owner_email: user.email
    }));

    res.json(itemsWithInfo);
  } catch (error) {
    console.error('Erreur lors de la récupération des annonces:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Obtenir les objets réservés par l'utilisateur connecté
app.get('/api/items/reserved', async (req, res) => {
  try {
    const user = await authUser(req);
    if (!user) return res.status(401).json({ error: 'Non autorisé' });

    // On cherche les objets où il y a une interaction 'reserved' par cet utilisateur
    // et dont le statut actuel de l'objet est toujours 'reserved'
    const items = await query(`
      SELECT i.*, u.name AS owner_name, u.username AS owner_username
      FROM items i
      JOIN item_interactions it ON i.id = it.item_id
      LEFT JOIN users u ON i.owner_id = u.id
      WHERE it.user_id = ? AND it.interaction_type = 'reserved' AND i.status = 'reserved'
      ORDER BY it.created_at DESC
    `, [user.id]) as any[];

    res.json(items);
  } catch (error) {
    console.error('Erreur lors de la récupération des réservations:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Supprimer une annonce
app.delete('/api/items/:id', async (req, res) => {
  try {
    const user = await authUser(req);
    if (!user) return res.status(401).json({ error: 'Non autorisé' });

    // Vérifier que l'annonce appartient à l'utilisateur
    const item = await query(queries.getItemById, [req.params.id]) as any[];
    if (item.length === 0) {
      return res.status(404).json({ error: 'Annonce non trouvée' });
    }

    if (item[0].owner_id !== user.id) {
      return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos propres annonces' });
    }

    // Supprimer l'annonce
    await query(`DELETE FROM items WHERE id = ?`, [req.params.id]);

    res.json({ message: 'Annonce supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'annonce:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Socket.io pour le chat en temps réel
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Gestion des connexions Socket.io
io.on('connection', (socket) => {
  console.log('Utilisateur connecté:', socket.id);

  // Rejoindre une conversation
  socket.on('join-conversation', (conversationId) => {
    socket.join(`conversation-${conversationId}`);
    console.log(`Utilisateur ${socket.id} a rejoint la conversation ${conversationId}`);
  });

  // Quitter une conversation
  socket.on('leave-conversation', (conversationId) => {
    socket.leave(`conversation-${conversationId}`);
    console.log(`Utilisateur ${socket.id} a quitté la conversation ${conversationId}`);
  });

  // Envoyer un message
  socket.on('send-message', async (data) => {
    try {
      const { conversationId, text, userId, userName, userUsername } = data;

      // Sauvegarder le message en base
      await query(queries.createMessage, [conversationId, userId, userName, userUsername, text]);

      // Diffuser le message à tous les participants de la conversation
      io.to(`conversation-${conversationId}`).emit('new-message', {
        id: Date.now().toString(),
        conversation_id: conversationId,
        sender_id: userId,
        sender_name: userName,
        sender_username: userUsername,
        text: text,
        created_at: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erreur lors de l\'envoi du message via socket:', error);
      socket.emit('error', { message: 'Erreur lors de l\'envoi du message' });
    }
  });

  // Déconnexion
  socket.on('disconnect', () => {
    console.log('Utilisateur déconnecté:', socket.id);
  });
});

// Démarrer le serveur
server.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📡 API disponible sur http://localhost:${PORT}`);
  console.log(`💬 Chat WebSocket disponible sur ws://localhost:${PORT}`);
});