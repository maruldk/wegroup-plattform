'use client';

import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'events';

export interface SocketMessage {
  id: string;
  conversationId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  senderId: string;
  createdAt: string;
  isEdited?: boolean;
  sender?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface SocketUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  lastSeen?: string;
}

export interface TypingData {
  conversationId: string;
  userId: string;
  userName?: string;
}

export interface ReactionData {
  messageId: string;
  conversationId: string;
  userId: string;
  emoji: string;
  createdAt?: string;
}

export class SocketClient extends EventEmitter {
  private socket: Socket | null = null;
  private wsUrl: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private userId: string | null = null;
  private token: string | null = null;

  constructor(wsUrl: string) {
    super();
    this.wsUrl = wsUrl;
  }

  connect(userId: string, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting || (this.socket && this.socket.connected)) {
        resolve();
        return;
      }

      this.isConnecting = true;
      this.userId = userId;
      this.token = token;

      this.socket = io(this.wsUrl, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        auth: {
          userId,
          token
        }
      });

      this.setupEventListeners();

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.emit('connected');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.isConnecting = false;
        this.emit('connection_error', error);
        reject(error);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.emit('disconnected');
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.emit('disconnected', reason);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      this.emit('reconnected', attemptNumber);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed');
      this.emit('reconnect_failed');
    });

    // Authentication events
    this.socket.on('authenticated', (data) => {
      console.log('WebSocket authenticated:', data);
      this.emit('authenticated', data);
    });

    this.socket.on('authentication_error', (error) => {
      console.error('WebSocket authentication error:', error);
      this.emit('authentication_error', error);
    });

    // Message events
    this.socket.on('new_message', (message: SocketMessage) => {
      this.emit('new_message', message);
    });

    // Conversation events
    this.socket.on('conversation_joined', (data) => {
      this.emit('conversation_joined', data);
    });

    this.socket.on('user_joined', (data) => {
      this.emit('user_joined', data);
    });

    this.socket.on('user_left', (data) => {
      this.emit('user_left', data);
    });

    // Typing events
    this.socket.on('user_typing', (data: TypingData) => {
      this.emit('user_typing', data);
    });

    this.socket.on('user_stopped_typing', (data: TypingData) => {
      this.emit('user_stopped_typing', data);
    });

    // Reaction events
    this.socket.on('reaction_added', (data: ReactionData) => {
      this.emit('reaction_added', data);
    });

    this.socket.on('reaction_removed', (data: ReactionData) => {
      this.emit('reaction_removed', data);
    });

    // User status events
    this.socket.on('user_online', (data) => {
      this.emit('user_online', data);
    });

    this.socket.on('user_offline', (data) => {
      this.emit('user_offline', data);
    });

    // Error events
    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });
  }

  // Conversation methods
  joinConversation(conversationId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('join_conversation', {
        conversationId,
        userId: this.userId
      });
    }
  }

  leaveConversation(conversationId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave_conversation', {
        conversationId,
        userId: this.userId
      });
    }
  }

  // Message methods
  sendMessage(data: {
    conversationId: string;
    content: string;
    type?: string;
  }): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('send_message', {
        ...data,
        senderId: this.userId,
        type: data.type || 'TEXT'
      });
    }
  }

  // Typing methods
  startTyping(conversationId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('typing_start', {
        conversationId,
        userId: this.userId
      });
    }
  }

  stopTyping(conversationId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('typing_stop', {
        conversationId,
        userId: this.userId
      });
    }
  }

  // Reaction methods
  addReaction(messageId: string, conversationId: string, emoji: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('add_reaction', {
        messageId,
        conversationId,
        emoji
      });
    }
  }

  removeReaction(messageId: string, conversationId: string, emoji: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('remove_reaction', {
        messageId,
        conversationId,
        emoji
      });
    }
  }

  // Authentication
  authenticate(): void {
    if (this.socket && this.socket.connected && this.userId && this.token) {
      this.socket.emit('authenticate', {
        userId: this.userId,
        token: this.token
      });
    }
  }

  // Status methods
  isConnected(): boolean {
    return this.socket ? this.socket.connected : false;
  }

  getConnectionState(): 'connected' | 'connecting' | 'disconnected' {
    if (this.isConnecting) return 'connecting';
    if (this.socket && this.socket.connected) return 'connected';
    return 'disconnected';
  }

  // Event listener helpers
  onNewMessage(callback: (message: SocketMessage) => void): () => void {
    this.on('new_message', callback);
    return () => this.off('new_message', callback);
  }

  onUserJoined(callback: (data: any) => void): () => void {
    this.on('user_joined', callback);
    return () => this.off('user_joined', callback);
  }

  onUserLeft(callback: (data: any) => void): () => void {
    this.on('user_left', callback);
    return () => this.off('user_left', callback);
  }

  onTyping(callback: (data: TypingData) => void): () => void {
    this.on('user_typing', callback);
    this.on('user_stopped_typing', callback);
    return () => {
      this.off('user_typing', callback);
      this.off('user_stopped_typing', callback);
    };
  }

  onReaction(callback: (data: ReactionData) => void): () => void {
    this.on('reaction_added', callback);
    this.on('reaction_removed', callback);
    return () => {
      this.off('reaction_added', callback);
      this.off('reaction_removed', callback);
    };
  }

  onConnectionChange(callback: (state: string) => void): () => void {
    this.on('connected', () => callback('connected'));
    this.on('disconnected', () => callback('disconnected'));
    this.on('connection_error', () => callback('error'));
    return () => {
      this.off('connected', callback);
      this.off('disconnected', callback);
      this.off('connection_error', callback);
    };
  }
}