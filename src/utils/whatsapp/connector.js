/**
 * WhatsApp Web Connector
 * Manages WhatsApp Web sessions using whatsapp-web.js
 *
 * Why whatsapp-web.js:
 * - More stable and mature than Baileys
 * - Better documentation and community support
 * - Easier to implement for MVP
 * - Built-in QR code generation
 * - Good session management
 *
 * Trade-offs:
 * - Requires Chromium/Puppeteer (heavier)
 * - May break on WhatsApp Web updates
 * - Not officially supported by WhatsApp
 */

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs').promises;
const path = require('path');
const { supabaseAdmin } = require('../../lib/supabase');
const { encrypt, decrypt } = require('../../lib/encryption');

class WhatsAppConnector {
  constructor() {
    this.clients = new Map(); // sessionId -> client instance
    this.qrCodes = new Map(); // sessionId -> QR code data
    this.sessionDataPath = process.env.SESSION_DATA_PATH || './session-data';
  }

  /**
   * Initialize session data directory
   */
  async initSessionDataDir() {
    try {
      await fs.mkdir(this.sessionDataPath, { recursive: true });
    } catch (error) {
      console.error('Error creating session data directory:', error);
    }
  }

  /**
   * Create and start a new WhatsApp session
   * @param {string} sessionId - Unique session identifier
   * @param {string} userId - User ID from Supabase
   * @returns {Promise<Object>} Session info
   */
  async startSession(sessionId, userId) {
    if (this.clients.has(sessionId)) {
      throw new Error('Session already exists');
    }

    await this.initSessionDataDir();

    const sessionPath = path.join(this.sessionDataPath, sessionId);

    // Create WhatsApp client
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: sessionId,
        dataPath: sessionPath,
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      },
    });

    // Set up event handlers
    this.setupEventHandlers(client, sessionId, userId);

    // Store client
    this.clients.set(sessionId, client);

    // Initialize client
    await client.initialize();

    return {
      sessionId,
      status: 'connecting',
      message: 'Session initialized. Waiting for QR code...',
    };
  }

  /**
   * Set up event handlers for WhatsApp client
   */
  setupEventHandlers(client, sessionId, userId) {
    // QR Code received
    client.on('qr', async (qr) => {
      console.log(`QR Code generated for session ${sessionId}`);

      try {
        // Generate base64 QR code image
        const qrDataUrl = await qrcode.toDataURL(qr);
        this.qrCodes.set(sessionId, qrDataUrl);

        // Update session in database
        await supabaseAdmin
          .from('sessions')
          .update({
            qr_code: qrDataUrl,
            status: 'connecting',
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId);

      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    });

    // Client is ready
    client.on('ready', async () => {
      console.log(`WhatsApp client ready for session ${sessionId}`);

      try {
        const info = client.info;

        // Update session in database
        await supabaseAdmin
          .from('sessions')
          .update({
            status: 'connected',
            phone_number: info.wid.user,
            qr_code: null,
            last_connected_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId);

        // Clear QR code
        this.qrCodes.delete(sessionId);

      } catch (error) {
        console.error('Error updating session on ready:', error);
      }
    });

    // Authentication successful
    client.on('authenticated', async () => {
      console.log(`Client authenticated for session ${sessionId}`);
    });

    // Authentication failure
    client.on('auth_failure', async (msg) => {
      console.error(`Authentication failed for session ${sessionId}:`, msg);

      await supabaseAdmin
        .from('sessions')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
    });

    // Client disconnected
    client.on('disconnected', async (reason) => {
      console.log(`Client disconnected for session ${sessionId}:`, reason);

      await supabaseAdmin
        .from('sessions')
        .update({
          status: 'disconnected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      // Clean up
      this.clients.delete(sessionId);
      this.qrCodes.delete(sessionId);
    });

    // New message received
    client.on('message', async (message) => {
      await this.handleIncomingMessage(message, sessionId);
    });

    // Message acknowledgment
    client.on('message_ack', async (message, ack) => {
      await this.handleMessageAck(message, ack, sessionId);
    });
  }

  /**
   * Handle incoming messages
   */
  async handleIncomingMessage(message, sessionId) {
    try {
      const messageData = {
        session_id: sessionId,
        message_id: message.id._serialized,
        from_number: message.from,
        to_number: message.to,
        chat_id: message.from,
        type: message.type,
        content: message.body,
        timestamp: message.timestamp * 1000, // Convert to milliseconds
        is_from_me: message.fromMe,
        is_forwarded: message.isForwarded,
        has_media: message.hasMedia,
        ack_status: 0,
      };

      // Handle media
      if (message.hasMedia) {
        const media = await message.downloadMedia();
        if (media) {
          messageData.media_mime_type = media.mimetype;
          // Media will be uploaded to Supabase Storage in a separate function
          // For now, store base64 data (not recommended for production)
          messageData.content = `[Media: ${media.mimetype}]`;
        }
      }

      // Insert message into database
      await supabaseAdmin.from('messages').insert(messageData);

    } catch (error) {
      console.error('Error handling incoming message:', error);
    }
  }

  /**
   * Handle message acknowledgment updates
   */
  async handleMessageAck(message, ack, sessionId) {
    try {
      await supabaseAdmin
        .from('messages')
        .update({ ack_status: ack })
        .eq('session_id', sessionId)
        .eq('message_id', message.id._serialized);

    } catch (error) {
      console.error('Error updating message ack:', error);
    }
  }

  /**
   * Get QR code for session
   * @param {string} sessionId
   * @returns {string|null} QR code data URL
   */
  getQRCode(sessionId) {
    return this.qrCodes.get(sessionId) || null;
  }

  /**
   * Get session status
   * @param {string} sessionId
   * @returns {Object} Session status
   */
  async getSessionStatus(sessionId) {
    const client = this.clients.get(sessionId);

    if (!client) {
      return { status: 'disconnected', message: 'Session not found' };
    }

    const state = await client.getState();

    return {
      status: state === 'CONNECTED' ? 'connected' : 'connecting',
      state,
      hasQR: this.qrCodes.has(sessionId),
    };
  }

  /**
   * Send a text message
   * @param {string} sessionId
   * @param {string} to - Phone number with country code (e.g., 1234567890@c.us)
   * @param {string} message - Message text
   * @returns {Promise<Object>} Sent message info
   */
  async sendMessage(sessionId, to, message) {
    const client = this.clients.get(sessionId);

    if (!client) {
      throw new Error('Session not found or not connected');
    }

    const chatId = to.includes('@c.us') ? to : `${to}@c.us`;
    const sentMessage = await client.sendMessage(chatId, message);

    // Save to database
    const messageData = {
      session_id: sessionId,
      message_id: sentMessage.id._serialized,
      from_number: sentMessage.from,
      to_number: sentMessage.to,
      chat_id: chatId,
      type: 'text',
      content: message,
      timestamp: sentMessage.timestamp * 1000,
      is_from_me: true,
      ack_status: sentMessage.ack || 0,
    };

    await supabaseAdmin.from('messages').insert(messageData);

    return {
      success: true,
      messageId: sentMessage.id._serialized,
      timestamp: sentMessage.timestamp,
    };
  }

  /**
   * Send media message
   * @param {string} sessionId
   * @param {string} to - Phone number
   * @param {string} mediaPath - Path to media file or base64
   * @param {string} caption - Optional caption
   * @returns {Promise<Object>} Sent message info
   */
  async sendMedia(sessionId, to, mediaPath, caption = '') {
    const client = this.clients.get(sessionId);

    if (!client) {
      throw new Error('Session not found or not connected');
    }

    const chatId = to.includes('@c.us') ? to : `${to}@c.us`;

    // Create media object
    const media = await MessageMedia.fromFilePath(mediaPath);
    const sentMessage = await client.sendMessage(chatId, media, { caption });

    // Save to database
    const messageData = {
      session_id: sessionId,
      message_id: sentMessage.id._serialized,
      from_number: sentMessage.from,
      to_number: sentMessage.to,
      chat_id: chatId,
      type: sentMessage.type,
      content: caption,
      timestamp: sentMessage.timestamp * 1000,
      is_from_me: true,
      has_media: true,
      ack_status: sentMessage.ack || 0,
    };

    await supabaseAdmin.from('messages').insert(messageData);

    return {
      success: true,
      messageId: sentMessage.id._serialized,
      timestamp: sentMessage.timestamp,
    };
  }

  /**
   * Close and destroy a session
   * @param {string} sessionId
   */
  async closeSession(sessionId) {
    const client = this.clients.get(sessionId);

    if (client) {
      await client.destroy();
      this.clients.delete(sessionId);
      this.qrCodes.delete(sessionId);
    }

    // Update database
    await supabaseAdmin
      .from('sessions')
      .update({
        status: 'disconnected',
        qr_code: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    return { success: true, message: 'Session closed' };
  }

  /**
   * Get all chats for a session
   * @param {string} sessionId
   * @returns {Promise<Array>} List of chats
   */
  async getChats(sessionId) {
    const client = this.clients.get(sessionId);

    if (!client) {
      throw new Error('Session not found or not connected');
    }

    const chats = await client.getChats();

    return chats.map(chat => ({
      id: chat.id._serialized,
      name: chat.name,
      isGroup: chat.isGroup,
      unreadCount: chat.unreadCount,
      timestamp: chat.timestamp,
    }));
  }
}

// Singleton instance
const connector = new WhatsAppConnector();

module.exports = connector;
