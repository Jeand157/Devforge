// Requêtes SQL pour LocalLoop avec authentification email
export const queries = {
  // Users
  createUser: `
    INSERT INTO users (id, name, email, username, avatar_url, password_hash) 
    VALUES (UUID(), ?, ?, ?, ?, ?)
  `,

  getUserByEmail: `
    SELECT * FROM users WHERE email = ?
  `,

  getUserByUsername: `
    SELECT * FROM users WHERE username = ?
  `,

  getUserById: `
    SELECT * FROM users WHERE id = ?
  `,

  updateUser: `
    UPDATE users SET name = ?, email = ?, username = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `,

  // Sessions
  createSession: `
    INSERT INTO user_sessions (id, user_id, token, expires_at) 
    VALUES (UUID(), ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))
  `,

  getSessionByToken: `
    SELECT s.*, u.id, u.name, u.email, u.username, u.avatar_url
    FROM user_sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > NOW()
  `,

  deleteSession: `
    DELETE FROM user_sessions WHERE token = ?
  `,

  // Items
  createItem: `
    INSERT INTO items (id, title, description, latitude, longitude, location, image_url, category, status, owner_id) 
    VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, 'available', ?)
  `,

  getItemById: `
    SELECT i.*, u.name AS owner_name, u.username AS owner_username, u.email AS owner_email
    FROM items i 
    JOIN users u ON i.owner_id = u.id 
    WHERE i.id = ?
  `,

  getItemsNearby: `
    SELECT 
      i.*,
      u.name AS owner_name,
      u.username AS owner_username,
      u.email AS owner_email,
      calculate_distance(?, ?, i.latitude, i.longitude) AS distance_km
    FROM items i
    JOIN users u ON i.owner_id = u.id
    WHERE calculate_distance(?, ?, i.latitude, i.longitude) <= ?
    ORDER BY distance_km
  `,

  updateItemStatus: `
    UPDATE items SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `,

  // Conversations
  createConversation: `
    INSERT INTO conversations (id, user_a_id, user_b_id, user_a_name, user_b_name, user_a_username, user_b_username) 
    VALUES (UUID(), ?, ?, ?, ?, ?, ?)
  `,

  getConversationByUsers: `
    SELECT * FROM conversations 
    WHERE (user_a_id = ? AND user_b_id = ?) OR (user_a_id = ? AND user_b_id = ?)
  `,

  getConversationById: `
    SELECT * FROM conversations WHERE id = ?
  `,

  getUserConversations: `
    SELECT c.*, 
           CASE 
             WHEN c.user_a_id = ? THEN u2.name 
             ELSE u1.name 
           END AS other_user_name,
           CASE 
             WHEN c.user_a_id = ? THEN u2.username 
             ELSE u1.username 
           END AS other_user_username,
           CASE 
             WHEN c.user_a_id = ? THEN u2.avatar_url 
             ELSE u1.avatar_url 
           END AS other_user_avatar
    FROM conversations c
    LEFT JOIN users u1 ON c.user_a_id = u1.id
    LEFT JOIN users u2 ON c.user_b_id = u2.id
    WHERE c.user_a_id = ? OR c.user_b_id = ?
    ORDER BY c.updated_at DESC
  `,

  // Messages
  createMessage: `
    INSERT INTO messages (id, conversation_id, sender_id, sender_name, sender_username, text) 
    VALUES (UUID(), ?, ?, ?, ?, ?)
  `,

  getMessagesByConversation: `
    SELECT m.*, u.avatar_url AS sender_avatar
    FROM messages m
    LEFT JOIN users u ON m.sender_id = u.id
    WHERE m.conversation_id = ? 
    ORDER BY m.created_at ASC
  `,

  getLastMessageByConversation: `
    SELECT m.*, u.avatar_url AS sender_avatar
    FROM messages m
    LEFT JOIN users u ON m.sender_id = u.id
    WHERE m.conversation_id = ?
    ORDER BY m.created_at DESC
    LIMIT 1
  `,

  // Stats
  getUserStats: `
    SELECT
      COUNT(CASE WHEN status = 'given' THEN 1 END) AS donated_count,
      COUNT(CASE WHEN status = 'reserved' THEN 1 END) AS reserved_count,
      COUNT(id) AS total_items
    FROM items
    WHERE owner_id = ?
  `,

  // Chat - nouvelles requêtes
  getUnreadMessageCount: `
    SELECT COUNT(*) as unread_count
    FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    WHERE (c.user_a_id = ? OR c.user_b_id = ?) 
    AND m.sender_id != ?
    AND m.created_at > (
      SELECT COALESCE(MAX(last_read_at), '1970-01-01')
      FROM user_conversation_reads 
      WHERE user_id = ? AND conversation_id = m.conversation_id
    )
  `,

  markMessagesAsRead: `
    INSERT INTO user_conversation_reads (user_id, conversation_id, last_read_at)
    VALUES (?, ?, NOW())
    ON DUPLICATE KEY UPDATE last_read_at = NOW()
  `,

  // Recherche d'utilisateurs pour le chat
  searchUsers: `
    SELECT id, name, username, avatar_url
    FROM users 
    WHERE (name LIKE ? OR username LIKE ?) 
    AND id != ?
    LIMIT 10
  `
};