/**
 * Chat Service
 * Handles chat communication with AWS backend
 * Supports message persistence, history, and real-time updates
 */

import { getGlobalHttpApi } from '@shared/mfe';

export interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: number;
  status: 'sent' | 'delivered' | 'failed';
  sessionId: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface ChatResponse {
  message: string;
  sessionId: string;
  timestamp: number;
}

class ChatService {
  private awsApiEndpoint: string;
  private httpApi = getGlobalHttpApi();
  private sessionId: string | null = null;
  private messageQueue: ChatMessage[] = [];
  private messageHandlers: ((msg: ChatMessage) => void)[] = [];
  private pollInterval: NodeJS.Timeout | null = null;
  private isOnline = true;

  constructor(awsApiEndpoint?: string) {
    this.awsApiEndpoint =
      awsApiEndpoint ||
      (process.env.VITE_AWS_CHAT_API || 'https://api.example.com/chat');

    // Monitor online status
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('[ChatService] Online');
      this._flushMessageQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('[ChatService] Offline');
    });
  }

  /**
   * Initialize chat session
   */
  async initializeSession(userId: string): Promise<ChatSession> {
    try {
      console.log('[ChatService] Initializing session for user:', userId);

      const response = await this.httpApi.post<{ sessionId: string; messages: ChatMessage[] }>(
        `${this.awsApiEndpoint}/sessions/create`,
        { userId, timestamp: Date.now() },
        { timeout: 10000 }
      );

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
      }

      this.sessionId = response.data.sessionId;

      console.log('[ChatService] Session initialized:', this.sessionId);

      return {
        id: this.sessionId,
        userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: response.data.messages || [],
      };
    } catch (error) {
      console.error('[ChatService] Failed to initialize session:', error);
      throw error;
    }
  }

  /**
   * Send message
   */
  async sendMessage(content: string, sender: string = 'user'): Promise<ChatMessage> {
    if (!this.sessionId) {
      throw new Error('Chat session not initialized');
    }

    if (!content || content.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }

    const message: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sender,
      content: content.trim(),
      timestamp: Date.now(),
      status: 'sent',
      sessionId: this.sessionId,
    };

    // Add to queue
    this.messageQueue.push(message);

    // Notify local handlers
    this._notifyHandlers(message);

    // Send to server if online
    if (this.isOnline) {
      await this._sendToServer(message);
    } else {
      console.warn('[ChatService] Offline - message queued for delivery');
    }

    return message;
  }

  /**
   * Send message to AWS server
   */
  private async _sendToServer(message: ChatMessage): Promise<void> {
    try {
      const response = await this.httpApi.post<ChatResponse>(
        `${this.awsApiEndpoint}/messages/send`,
        {
          sessionId: this.sessionId,
          sender: message.sender,
          content: message.content,
          timestamp: message.timestamp,
        },
        { timeout: 10000, retry: 3 }
      );

      if (response.ok) {
        // Update message status
        message.status = 'delivered';
        console.log('[ChatService] Message delivered:', message.id);
      } else {
        message.status = 'failed';
        console.error('[ChatService] Failed to send message:', response.statusText);
      }
    } catch (error) {
      message.status = 'failed';
      console.error('[ChatService] Error sending message:', error);
    }
  }

  /**
   * Flush queued messages
   */
  private async _flushMessageQueue(): Promise<void> {
    const failedMessages = this.messageQueue.filter(m => m.status !== 'delivered');

    for (const message of failedMessages) {
      try {
        await this._sendToServer(message);
      } catch (error) {
        console.error('[ChatService] Failed to flush message:', error);
      }
    }
  }

  /**
   * Get chat history
   */
  async getHistory(limit: number = 50): Promise<ChatMessage[]> {
    if (!this.sessionId) {
      throw new Error('Chat session not initialized');
    }

    try {
      const response = await this.httpApi.get<{ messages: ChatMessage[] }>(
        `${this.awsApiEndpoint}/messages/history?sessionId=${this.sessionId}&limit=${limit}`,
        { timeout: 10000 }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch history: ${response.statusText}`);
      }

      return response.data.messages || [];
    } catch (error) {
      console.error('[ChatService] Failed to get history:', error);
      throw error;
    }
  }

  /**
   * Subscribe to messages
   */
  onMessage(handler: (message: ChatMessage) => void): () => void {
    this.messageHandlers.push(handler);

    // Start polling for new messages if not already running
    if (!this.pollInterval) {
      this.pollInterval = setInterval(() => this._pollMessages(), 3000);
    }

    // Return unsubscribe function
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
      if (this.messageHandlers.length === 0 && this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }
    };
  }

  /**
   * Poll for new messages
   */
  private async _pollMessages(): Promise<void> {
    if (!this.sessionId || !this.isOnline) {
      return;
    }

    try {
      const lastTimestamp = this.messageQueue.length > 0
        ? this.messageQueue[this.messageQueue.length - 1].timestamp
        : Date.now() - 60000; // Last 1 minute

      const response = await this.httpApi.get<{ messages: ChatMessage[] }>(
        `${this.awsApiEndpoint}/messages/poll?sessionId=${this.sessionId}&since=${lastTimestamp}`,
        { timeout: 5000 }
      );

      if (response.ok && response.data.messages) {
        for (const message of response.data.messages) {
          // Avoid duplicates
          if (!this.messageQueue.find(m => m.id === message.id)) {
            this.messageQueue.push(message);
            this._notifyHandlers(message);
          }
        }
      }
    } catch (error) {
      console.error('[ChatService] Error polling messages:', error);
    }
  }

  /**
   * Notify all handlers of new message
   */
  private _notifyHandlers(message: ChatMessage): void {
    this.messageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('[ChatService] Handler error:', error);
      }
    });
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId: string): Promise<void> {
    if (!this.sessionId) {
      throw new Error('Chat session not initialized');
    }

    try {
      const response = await this.httpApi.delete(
        `${this.awsApiEndpoint}/messages/${messageId}?sessionId=${this.sessionId}`,
        { timeout: 10000 }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete message: ${response.statusText}`);
      }

      // Remove from local queue
      this.messageQueue = this.messageQueue.filter(m => m.id !== messageId);

      console.log('[ChatService] Message deleted:', messageId);
    } catch (error) {
      console.error('[ChatService] Failed to delete message:', error);
      throw error;
    }
  }

  /**
   * Close session
   */
  async closeSession(): Promise<void> {
    if (!this.sessionId) {
      return;
    }

    try {
      // Stop polling
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }

      await this.httpApi.post(
        `${this.awsApiEndpoint}/sessions/close`,
        { sessionId: this.sessionId, timestamp: Date.now() },
        { timeout: 10000 }
      );

      this.sessionId = null;
      this.messageQueue = [];
      this.messageHandlers = [];

      console.log('[ChatService] Session closed');
    } catch (error) {
      console.error('[ChatService] Failed to close session:', error);
      throw error;
    }
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Get message count
   */
  getMessageCount(): number {
    return this.messageQueue.length;
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.isOnline && this.sessionId !== null;
  }
}

let globalChatService: ChatService | null = null;

export const getGlobalChatService = (awsApiEndpoint?: string): ChatService => {
  if (!globalChatService) {
    globalChatService = new ChatService(awsApiEndpoint);
  }
  return globalChatService;
};

export { ChatService };
