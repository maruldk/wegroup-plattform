
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
      status: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE';
    };
    role: 'ADMIN' | 'MODERATOR' | 'MEMBER';
  }>;
  lastMessageAt?: string;
}

interface ChatWindowProps {
  conversation: Conversation;
  currentUserId: string;
  messages: Message[];
  onSendMessage: (content: string, type?: 'TEXT' | 'IMAGE' | 'FILE') => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
  isLoading?: boolean;
  typingUsers?: Array<{ id: string; name: string }>;
  className?: string;
}

export function ChatWindow({
  conversation,
  currentUserId,
  messages,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onAddReaction,
  onRemoveReaction,
  isLoading = false,
  typingUsers = [],
  className
}: ChatWindowProps) {
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isScrolledToBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isScrolledToBottom]);

  // Handle scroll events to detect if user is at bottom
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold
      setIsScrolledToBottom(isAtBottom);
    }
  };

  // Get conversation title
  const getConversationTitle = () => {
    if (conversation.title) return conversation.title;
    
    if (conversation.type === 'DIRECT') {
      const otherParticipant = conversation.participants.find(
        p => p.user.id !== currentUserId
      );
      return otherParticipant?.user.name || 'Unknown User';
    }
    
    return `Group Chat (${conversation.participants.length} members)`;
  };

  // Get conversation subtitle
  const getConversationSubtitle = () => {
    if (conversation.type === 'DIRECT') {
      const otherParticipant = conversation.participants.find(
        p => p.user.id !== currentUserId
      );
      return otherParticipant ? (
        <UserStatus 
          status={otherParticipant.user.status} 
          showText 
          className="text-sm"
        />
      ) : null;
    }
    
    const onlineCount = conversation.participants.filter(
      p => p.user.status === 'ONLINE'
    ).length;
    
    return (
      <span className="text-sm text-muted-foreground">
        {conversation.participants.length} members, {onlineCount} online
      </span>
    );
  };

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center space-x-3">
          <div className="relative">
            {conversation.type === 'DIRECT' ? (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-secondary-foreground" />
              </div>
            )}
          </div>
          <div>
            <h2 className="font-semibold text-lg">{getConversationTitle()}</h2>
            {getConversationSubtitle()}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-accent rounded-lg transition-colors">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-accent rounded-lg transition-colors">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-accent rounded-lg transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onScroll={handleScroll}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <MessageList
              messages={messages}
              currentUserId={currentUserId}
              onEditMessage={onEditMessage}
              onDeleteMessage={onDeleteMessage}
              onAddReaction={onAddReaction}
              onRemoveReaction={onRemoveReaction}
            />
            
            {/* Typing indicators */}
            {typingUsers.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span>
                  {typingUsers.length === 1 
                    ? `${typingUsers[0].name} is typing...`
                    : `${typingUsers.length} people are typing...`
                  }
                </span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Scroll to bottom button */}
      {!isScrolledToBottom && (
        <div className="absolute bottom-20 right-6">
          <button
            onClick={() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              setIsScrolledToBottom(true);
            }}
            className="bg-primary text-primary-foreground rounded-full p-2 shadow-lg hover:bg-primary/90 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Message Input */}
      <div className="border-t bg-card p-4">
        <MessageInput
          onSendMessage={onSendMessage}
          placeholder={`Message ${getConversationTitle()}...`}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}
