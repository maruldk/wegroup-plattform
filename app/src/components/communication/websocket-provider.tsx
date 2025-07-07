'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendMessage: (data: {
    conversationId: string;
    content: string;
    type?: string;
  }) => void;
  onNewMessage: (callback: (message: any) => void) => void;
  onUserJoined: (callback: (data: any) => void) => void;
  onUserLeft: (callback: (data: any) => void) => void;
  onTyping: (callback: (data: any) => void) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { data: session } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  useEffect(() => {
    if (!session?.user) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
    
    setConnectionStatus('connecting');
    
    const newSocket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        userId: session.user.id,
        token: session.accessToken
      }
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setConnectionStatus('connected');
      toast.success('Connected to chat server');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      
      if (reason === 'io server disconnect') {
        toast.error('Disconnected from chat server');
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnectionStatus('error');
      toast.error('Failed to connect to chat server');
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      toast.success('Reconnected to chat server');
    });

    newSocket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed');
      setConnectionStatus('error');
      toast.error('Failed to reconnect to chat server');
    });

    // Authentication
    newSocket.emit('authenticate', {
      userId: session.user.id,
      token: session.accessToken
    });

    newSocket.on('authenticated', (data) => {
      console.log('WebSocket authenticated:', data);
    });

    newSocket.on('authentication_error', (error) => {
      console.error('WebSocket authentication error:', error);
      toast.error('Authentication failed');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [session]);

  const joinConversation = useCallback((conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('join_conversation', {
        conversationId,
        userId: session?.user?.id
      });
    }
  }, [socket, isConnected, session]);

  const leaveConversation = useCallback((conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('leave_conversation', {
        conversationId,
        userId: session?.user?.id
      });
    }
  }, [socket, isConnected, session]);

  const sendMessage = useCallback((data: {
    conversationId: string;
    content: string;
    type?: string;
  }) => {
    if (socket && isConnected) {
      socket.emit('send_message', {
        ...data,
        senderId: session?.user?.id,
        type: data.type || 'TEXT'
      });
    }
  }, [socket, isConnected, session]);

  const onNewMessage = useCallback((callback: (message: any) => void) => {
    if (socket) {
      socket.on('new_message', callback);
      return () => socket.off('new_message', callback);
    }
  }, [socket]);

  const onUserJoined = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('user_joined', callback);
      return () => socket.off('user_joined', callback);
    }
  }, [socket]);

  const onUserLeft = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('user_left', callback);
      return () => socket.off('user_left', callback);
    }
  }, [socket]);

  const onTyping = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('user_typing', callback);
      socket.on('user_stopped_typing', callback);
      return () => {
        socket.off('user_typing', callback);
        socket.off('user_stopped_typing', callback);
      };
    }
  }, [socket]);

  const startTyping = useCallback((conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('typing_start', {
        conversationId,
        userId: session?.user?.id
      });
    }
  }, [socket, isConnected, session]);

  const stopTyping = useCallback((conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('typing_stop', {
        conversationId,
        userId: session?.user?.id
      });
    }
  }, [socket, isConnected, session]);

  const value: WebSocketContextType = {
    socket,
    isConnected,
    connectionStatus,
    joinConversation,
    leaveConversation,
    sendMessage,
    onNewMessage,
    onUserJoined,
    onUserLeft,
    onTyping,
    startTyping,
    stopTyping
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}