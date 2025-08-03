import SQLite from 'react-native-sqlite-storage';

// Enable promise for SQLite
SQLite.enablePromise(true);

class DatabaseHelper {
  constructor() {
    this.db = null;
  }

  // Initialize database
  async initDB() {
    try {
      this.db = await SQLite.openDatabase({
        name: 'ChatApp.db',
        location: 'default',
      });

      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
    }
  }

  // Create tables
  async createTables() {
    const createChatsTable = `
      CREATE TABLE IF NOT EXISTS chats (
        _id TEXT PRIMARY KEY,
        chatName TEXT,
        isGroupChat INTEGER,
        users TEXT,
        latestMessage TEXT,
        groupAdmin TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        lastSynced TEXT
      )
    `;
    const createMessagesTable = `
      CREATE TABLE IF NOT EXISTS messages (
        _id TEXT PRIMARY KEY,
        chatId TEXT,
        content TEXT,
        sender TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        isDeleted INTEGER DEFAULT 0,
        isSent INTEGER DEFAULT 1,
        lastSynced TEXT,
        FOREIGN KEY (chatId) REFERENCES chats (_id)
      )
    `;
    await this.db.executeSql(createChatsTable);
    await this.db.executeSql(createMessagesTable);
  }

  // Save chats to local database
  async saveChats(chats) {
    try {
      // Clear existing chats first
      await this.db.executeSql('DELETE FROM chats');

      // Insert new chats
      for (const chat of chats) {
        const insertQuery = `
          INSERT OR REPLACE INTO chats 
          (_id, chatName, isGroupChat, users, latestMessage, groupAdmin, createdAt, updatedAt, lastSynced)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await this.db.executeSql(insertQuery, [
          chat._id,
          chat.chatName,
          chat.isGroupChat ? 1 : 0,
          JSON.stringify(chat.users),
          JSON.stringify(chat.latestMessage),
          JSON.stringify(chat.groupAdmin),
          chat.createdAt,
          chat.updatedAt,
          new Date().toISOString(),
        ]);
      }

      console.log('Chats saved to local database');
    } catch (error) {
      console.error('Error saving chats:', error);
    }
  }

  // Get chats from local database
  async getChats() {
    try {
      const results = await this.db.executeSql(
        'SELECT * FROM chats ORDER BY updatedAt DESC',
      );
      const chats = [];

      for (let i = 0; i < results[0].rows.length; i++) {
        const row = results[0].rows.item(i);
        chats.push({
          _id: row._id,
          chatName: row.chatName,
          isGroupChat: row.isGroupChat === 1,
          users: JSON.parse(row.users),
          latestMessage: row.latestMessage
            ? JSON.parse(row.latestMessage)
            : null,
          groupAdmin: row.groupAdmin ? JSON.parse(row.groupAdmin) : null,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        });
      }

      return chats;
    } catch (error) {
      console.error('Error getting chats:', error);
      return [];
    }
  }

  // Clear all chats
  async clearChats() {
    try {
      await this.db.executeSql('DELETE FROM chats');
      console.log('All chats cleared from local database');
    } catch (error) {
      console.error('Error clearing chats:', error);
    }
  }

  // Delete specific chat
  async deleteChat(chatId) {
    try {
      await this.db.executeSql('DELETE FROM chats WHERE _id = ?', [chatId]);
      console.log('Chat deleted from local database');
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  }

  async saveMessages(chatId, messages) {
    try {
      // Clear existing messages for this chat first
      await this.db.executeSql('DELETE FROM messages WHERE chatId = ?', [
        chatId,
      ]);

      // Insert new messages
      for (const message of messages) {
        const insertQuery = `
          INSERT OR REPLACE INTO messages 
          (_id, chatId, content, sender, createdAt, updatedAt, isDeleted, isSent, lastSynced)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await this.db.executeSql(insertQuery, [
          message._id,
          chatId,
          message.content,
          JSON.stringify(message.sender),
          message.createdAt,
          message.updatedAt,
          message.isDeleted ? 1 : 0,
          1, // isSent - true for messages from server
          new Date().toISOString(),
        ]);
      }

      console.log('Messages saved to local database');
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  }
  // Get messages from local database
  async getMessages(chatId) {
    try {
      const results = await this.db.executeSql(
        'SELECT * FROM messages WHERE chatId = ? AND isDeleted = 0 AND isSent = 1 ORDER BY createdAt ASC',
        [chatId],
      );
      const messages = [];

      for (let i = 0; i < results[0].rows.length; i++) {
        const row = results[0].rows.item(i);
        messages.push({
          _id: row._id,
          content: row.content,
          sender: JSON.parse(row.sender),
          chat: {_id: chatId},
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          // Remove isSent property for regular messages
        });
      }

      return messages;
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  // Save a single message (for real-time messages)
  async saveMessage(message) {
    try {
      const insertQuery = `
        INSERT OR REPLACE INTO messages 
        (_id, chatId, content, sender, createdAt, updatedAt, isDeleted, isSent, lastSynced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await this.db.executeSql(insertQuery, [
        message._id,
        message.chat._id,
        message.content,
        JSON.stringify(message.sender),
        message.createdAt,
        message.updatedAt,
        0, // isDeleted
        1, // isSent
        new Date().toISOString(),
      ]);

      console.log('Single message saved to local database');
    } catch (error) {
      console.error('Error saving single message:', error);
    }
  }

  // Save pending message (for offline sending)
  async savePendingMessage(tempId, chatId, content, sender) {
    try {
      const insertQuery = `
        INSERT INTO messages 
        (_id, chatId, content, sender, createdAt, updatedAt, isDeleted, isSent, lastSynced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const now = new Date().toISOString();

      await this.db.executeSql(insertQuery, [
        tempId,
        chatId,
        content,
        JSON.stringify(sender),
        now,
        now,
        0, // isDeleted
        0, // isSent - false for pending messages
        now,
      ]);

      console.log('Pending message saved to local database');
    } catch (error) {
      console.error('Error saving pending message:', error);
    }
  }

  // Get pending messages (not sent to server)
  async getPendingMessages(chatId) {
    try {
      const results = await this.db.executeSql(
        'SELECT * FROM messages WHERE chatId = ? AND isSent = 0 AND isDeleted = 0 ORDER BY createdAt ASC',
        [chatId],
      );
      const messages = [];

      for (let i = 0; i < results[0].rows.length; i++) {
        const row = results[0].rows.item(i);
        messages.push({
          _id: row._id,
          content: row.content,
          sender: JSON.parse(row.sender),
          chat: {_id: chatId},
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          isSent: false,
        });
      }

      return messages;
    } catch (error) {
      console.error('Error getting pending messages:', error);
      return [];
    }
  }

  // Update message as sent
  async markMessageAsSent(tempId, realId) {
    try {
      await this.db.executeSql(
        'UPDATE messages SET _id = ?, isSent = 1 WHERE _id = ?',
        [realId, tempId],
      );
      console.log('Message marked as sent');
    } catch (error) {
      console.error('Error marking message as sent:', error);
    }
  }

  // Delete message
  async deleteMessage(messageId) {
    try {
      await this.db.executeSql(
        'UPDATE messages SET isDeleted = 1 WHERE _id = ?',
        [messageId],
      );
      console.log('Message marked as deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }

  // Clear all messages for a chat
  async clearChatMessages(chatId) {
    try {
      await this.db.executeSql('DELETE FROM messages WHERE chatId = ?', [
        chatId,
      ]);
      console.log('All messages cleared for chat');
    } catch (error) {
      console.error('Error clearing chat messages:', error);
    }
  }
}

export default new DatabaseHelper();
