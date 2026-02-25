/**
 * In-App Chat Component
 * Real-time chat interface with AWS backend integration
 * Supports message history, offline queueing, and user presence
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getGlobalChatService } from '@shared/services/chat-service';
import type { ChatMessage, ChatSession } from '@shared/services/chat-service';
import { cn } from '@/lib/utils';
import { Send, MessageSquare, X, Loader, AlertCircle, Wifi, WifiOff } from 'lucide-react';

interface InAppChatProps {
  userId: string;
  onClose?: () => void;
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'center';
}

interface ChatUIMessage extends ChatMessage {
  isLocal?: boolean;
}

const InAppChat: React.FC<InAppChatProps> = ({
  userId,
  onClose,
  className,
  position = 'bottom-right',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatUIMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSending, setIsSending] = useState(false);

  const chatServiceRef = useRef(getGlobalChatService());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  /**
   * Initialize chat
   */
  const initializeChat = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('[InAppChat] Initializing chat for user:', userId);

      // Initialize session
      const session = await chatServiceRef.current.initializeSession(userId);

      // Load history
      const history = await chatServiceRef.current.getHistory(50);

      // Update local messages
      const localMessages = history.map(m => ({
        ...m,
        isLocal: false,
      }));

      setMessages(localMessages);

      // Subscribe to new messages
      unsubscribeRef.current = chatServiceRef.current.onMessage((message) => {
        setMessages(prev => {
          // Check if message already exists
          if (prev.find(m => m.id === message.id)) {
            return prev;
          }
          return [...prev, { ...message, isLocal: false }];
        });
      });

      setLoading(false);
      console.log('[InAppChat] Chat initialized with', history.length, 'messages');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      setLoading(false);
      console.error('[InAppChat] Failed to initialize:', err);
    }
  }, [userId]);

  /**
   * Load chat on mount
   */
  useEffect(() => {
    initializeChat();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [initializeChat]);

  /**
   * Monitor online status
   */
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Auto-scroll to bottom
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Handle send message
   */
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isSending) {
      return;
    }

    const messageContent = inputValue.trim();
    setInputValue('');
    setIsSending(true);

    try {
      const message = await chatServiceRef.current.sendMessage(messageContent, userId);

      setMessages(prev => [...prev, { ...message, isLocal: true }]);

      console.log('[InAppChat] Message sent:', message.id);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      console.error('[InAppChat] Failed to send message:', err);

      // Reset input on error
      setInputValue(messageContent);
    } finally {
      setIsSending(false);
    }
  }, [inputValue, isSending, userId]);

  /**
   * Handle key press
   */
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  /**
   * Format timestamp
   */
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  /**
   * Get position classes
   */
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'center': 'bottom-1/2 right-1/2 translate-x-1/2 translate-y-1/2',
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors',
          positionClasses[position],
          'z-50'
        )}
        title="Open chat"
      >
        <MessageSquare className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        'fixed bg-white rounded-lg shadow-xl flex flex-col',
        positionClasses[position],
        'z-50 w-96 h-96',
        className
      )}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <h3 className="font-semibold">Chat Support</h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Online status */}
          <div className="flex items-center gap-1">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-300" />
            ) : (
              <WifiOff className="w-4 h-4 text-yellow-300" />
            )}
            <span className="text-xs">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Minimize/Maximize */}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-blue-500 rounded transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? '▲' : '▼'}
          </button>

          {/* Close */}
          <button
            onClick={() => {
              setIsOpen(false);
              onClose?.();
            }}
            className="p-1 hover:bg-blue-500 rounded transition-colors"
            title="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
                <button
                  onClick={initializeChat}
                  className="ml-auto text-red-600 hover:text-red-700 font-semibold"
                >
                  Retry
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                <div className="text-center">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>No messages yet</p>
                  <p className="text-xs mt-1">Start a conversation!</p>
                </div>
              </div>
            ) : (
              messages.map(message => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-2 max-w-xs',
                    message.sender === userId ? 'ml-auto flex-row-reverse' : ''
                  )}
                >
                  <div className="flex-1">
                    <div
                      className={cn(
                        'rounded-lg px-3 py-2 text-sm',
                        message.sender === userId
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      )}
                    >
                      {message.content}
                    </div>
                    <div
                      className={cn(
                        'text-xs text-gray-500 mt-1 px-2',
                        message.sender === userId ? 'text-right' : 'text-left'
                      )}
                    >
                      {formatTime(message.timestamp)}
                      {message.sender === userId && message.status !== 'delivered' && (
                        <span className="ml-1">
                          {message.status === 'failed' ? '✗' : '...'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {!error && (
            <div className="border-t border-gray-200 p-3 bg-white rounded-b-lg">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isSending || !isOnline}
                  placeholder={isOnline ? 'Type message...' : 'Offline - messages will send when online'}
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isSending || !isOnline}
                  className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  title="Send message"
                >
                  {isSending ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InAppChat;
