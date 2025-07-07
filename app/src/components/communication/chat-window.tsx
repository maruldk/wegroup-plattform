'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { UserStatus } from './user-status';
import { cn } from '@/lib/utils';
import { User, MessageCircle, Phone, Video, MoreVertical } from 'lucide-react';

export interface Message {
  id: string;
  content: string;
  senderId: string;
  conversationId: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  createdAt: string;
  isEdited?: boolean;
  sender: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  attachments?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>;
  reactions?: Array<{
    id: string;
    emoji: string;
    userId: string;
  }>;
}

export interface Conversation {
  id: string;
  title?: string;
  type: 'DIRECT' | 'GROUP' | 'CHANNEL';
  isGroup: boolean;
  participants: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
    };
    role: 'ADMIN' | 'MEMBER' | 'MODERATOR';
    joinedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
  lastMessage?: Message;
  unreadCount?: number;
}

interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string, type?: string) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function ChatWindow({
  conversation,
  messages,
  currentUserId,
  onSendMessage,
  onTypingStart,
  onTypingStop,
  isLoading = false,
  className
}: ChatWindowProps) {
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (content: string, type = 'TEXT') => {
    onSendMessage(content, type);
    setIsTyping(false);
    onTypingStop?.();
  };

  const handleTypingStart = () => {
    if (!isTyping) {
      setIsTyping(true);
      onTypingStart?.();
    }
  };

  const handleTypingStop = () => {
    if (isTyping) {
      setIsTyping(false);
      onTypingStop?.();
    }
  };

  const getConversationTitle = () => {
    if (conversation.title) {
      return conversation.title;
    }
    
    if (conversation.type === 'DIRECT') {
      const otherParticipant = conversation.participants.find(
        p => p.user.id !== currentUserId
      );
      return otherParticipant?.user.name || 'Unknown User';
    }
    
    return `Group Chat (${conversation.participants.length} members)`;
  };

  const getConversationSubtitle = () => {
    if (conversation.type === 'DIRECT') {
      const otherParticipant = conversation.participants.find(
        p => p.user.id !== currentUserId
      );
      return otherParticipant?.user.email;
    }
    
    return `${conversation.participants.length} participants`;
  };

  return (
    <div className={cn('flex flex-col h-full bg-white', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="relative">
            {conversation.type === 'DIRECT' ? (
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-gray-600" />
              </div>
            ) : (
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
            )}
            <UserStatus 
              userId={conversation.type === 'DIRECT' ? 
                conversation.participants.find(p => p.user.id !== currentUserId)?.user.id : 
                undefined
              } 
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {getConversationTitle()}
            </h3>
            <p className="text-sm text-gray-500">
              {getConversationSubtitle()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <MessageList 
          messages={messages}
          currentUserId={currentUserId}
          isLoading={isLoading}
        />
        
        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="px-4 py-2 text-sm text-gray-500">
            {typingUsers.length === 1 
              ? `${typingUsers[0]} is typing...`
              : `${typingUsers.length} people are typing...`
            }
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200">
        <MessageInput 
          onSendMessage={handleSendMessage}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
          disabled={isLoading}
          placeholder={`Message ${getConversationTitle()}...`}
        />
      </div>
    </div>
  );
}