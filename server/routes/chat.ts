/**
 * Chat API Routes
 * Handles chat sessions, messages, and AWS integration
 * Mock implementation - replace with actual AWS API calls in production
 */

import { RequestHandler } from 'express';

// In-memory storage (replace with database in production)
const sessions: Record<string, any> = {};
const messages: Record<string, any[]> = {};
const lastMessageTime: Record<string, number> = {};

/**
 * POST /api/chat/sessions/create
 * Create a new chat session
 */
export const createSession: RequestHandler = (req, res) => {
  try {
    const { userId, timestamp } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const sessionId = `session-${userId}-${Date.now()}`;

    // Create session
    sessions[sessionId] = {
      id: sessionId,
      userId,
      createdAt: timestamp || Date.now(),
      updatedAt: Date.now(),
      status: 'active',
    };

    // Initialize messages array
    messages[sessionId] = [
      {
        id: `msg-bot-welcome-${Date.now()}`,
        sender: 'bot',
        content: 'Hello! How can we help you today? We are here 24/7 to assist you.',
        timestamp: Date.now(),
        status: 'delivered',
        sessionId,
      },
    ];

    lastMessageTime[sessionId] = Date.now();

    console.log('[Chat] Session created:', sessionId);

    res.json({
      sessionId,
      messages: messages[sessionId],
      status: 'created',
    });
  } catch (error) {
    console.error('[Chat] Error creating session:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

/**
 * POST /api/chat/messages/send
 * Send a message
 */
export const sendMessage: RequestHandler = (req, res) => {
  try {
    const { sessionId, sender, content, timestamp } = req.body;

    if (!sessionId || !sender || !content) {
      return res.status(400).json({
        error: 'sessionId, sender, and content are required',
      });
    }

    if (!messages[sessionId]) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Add user message
    const userMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sender,
      content,
      timestamp: timestamp || Date.now(),
      status: 'delivered',
      sessionId,
    };

    messages[sessionId].push(userMessage);
    lastMessageTime[sessionId] = Date.now();

    // Generate bot response (mock)
    const botResponse = {
      id: `msg-bot-${Date.now()}`,
      sender: 'bot',
      content: generateBotResponse(content),
      timestamp: Date.now() + 500,
      status: 'delivered',
      sessionId,
    };

    messages[sessionId].push(botResponse);

    console.log('[Chat] Message sent and response generated');

    res.json({
      message: 'Message received',
      sessionId,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[Chat] Error sending message:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

/**
 * GET /api/chat/messages/history
 * Get chat history
 */
export const getHistory: RequestHandler = (req, res) => {
  try {
    const { sessionId, limit = '50' } = req.query;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    if (!messages[sessionId]) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const limitNum = Math.min(parseInt(limit as string) || 50, 100);
    const chatMessages = messages[sessionId].slice(-limitNum);

    console.log('[Chat] History retrieved:', chatMessages.length, 'messages');

    res.json({
      messages: chatMessages,
      total: messages[sessionId].length,
      limit: limitNum,
    });
  } catch (error) {
    console.error('[Chat] Error getting history:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

/**
 * GET /api/chat/messages/poll
 * Poll for new messages (for real-time updates)
 */
export const pollMessages: RequestHandler = (req, res) => {
  try {
    const { sessionId, since = '0' } = req.query;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    if (!messages[sessionId]) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const sinceTime = parseInt(since as string) || 0;
    const newMessages = messages[sessionId].filter(m => m.timestamp > sinceTime);

    console.log('[Chat] Poll - found', newMessages.length, 'new messages');

    res.json({
      messages: newMessages,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[Chat] Error polling messages:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

/**
 * DELETE /api/chat/messages/:messageId
 * Delete a message
 */
export const deleteMessage: RequestHandler = (req, res) => {
  try {
    const { messageId } = req.params;
    const { sessionId } = req.query;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    if (!messages[sessionId]) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const messageIndex = messages[sessionId].findIndex(m => m.id === messageId);

    if (messageIndex === -1) {
      return res.status(404).json({ error: 'Message not found' });
    }

    messages[sessionId].splice(messageIndex, 1);

    console.log('[Chat] Message deleted:', messageId);

    res.json({
      message: 'Message deleted',
      messageId,
    });
  } catch (error) {
    console.error('[Chat] Error deleting message:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

/**
 * POST /api/chat/sessions/close
 * Close a chat session
 */
export const closeSession: RequestHandler = (req, res) => {
  try {
    const { sessionId, timestamp } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    if (!sessions[sessionId]) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Update session status
    sessions[sessionId].status = 'closed';
    sessions[sessionId].closedAt = timestamp || Date.now();

    console.log('[Chat] Session closed:', sessionId);

    res.json({
      message: 'Session closed',
      sessionId,
    });
  } catch (error) {
    console.error('[Chat] Error closing session:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

/**
 * Generate mock bot responses
 */
function generateBotResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();

  const responses: Record<string, string> = {
    hello: 'Hi there! How can I assist you?',
    help: 'Sure! I can help you with account issues, billing, or general questions. What would you like help with?',
    pricing: 'Our plans start from $29/month for individuals and go up to $299/month for enterprise. Would you like more details?',
    billing: 'I can help you with billing issues. Can you tell me more about what you need?',
    account: 'I can help you manage your account. What would you like to do?',
    thanks: 'You\'re welcome! Is there anything else I can help with?',
    goodbye: 'Thank you for chatting with us. Have a great day!',
  };

  // Check for keywords
  for (const [keyword, response] of Object.entries(responses)) {
    if (lowerMessage.includes(keyword)) {
      return response;
    }
  }

  // Default responses
  const defaultResponses = [
    'That\'s a great question! Let me help you with that.',
    'I understand. Can you provide more details?',
    'Thanks for reaching out. How else can I assist?',
    'I\'m here to help! Could you clarify that a bit more?',
    'Got it. Is there anything specific I can help with?',
  ];

  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

/**
 * GET /api/chat/health
 * Health check endpoint
 */
export const chatHealth: RequestHandler = (req, res) => {
  res.json({
    status: 'healthy',
    activeSessions: Object.keys(sessions).length,
    totalMessages: Object.values(messages).reduce((sum, msgs) => sum + msgs.length, 0),
    timestamp: Date.now(),
  });
};
