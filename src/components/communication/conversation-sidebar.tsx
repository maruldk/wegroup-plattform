
'use client';

import React, { useState } from 'react';
import { Search, Plus, MoreVertical, MessageCircle, Users, Hash } from 'lucide-react';
import { cn, formatDate, truncateText, generateAvatarUrl } from '@/lib/utils';
import { UserStatus } from './user-status';
import { NotificationBadge } from './notification-badge';

export interface ConversationSummary {
  id: string;
  title?: string;
  type: 'DIRECT' | 'GROUP' | 'CHANNEL';
  isGroup: boolean;
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    createdAt: string;
    type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  };
  participants: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
      status: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE';
    };
  }>;
  unreadCount: number;
  lastMessageAt?: string;
  isPinned?: boolean;
}

interface ConversationSidebarProps {
  conversations: ConversationSummary[];
  currentConversationId?: string;
  currentUserId: string;
  onSelectConversation: (conversationId: string) => void;
  onCreateConversation?: () => void;
  onSearchUsers?: (query: string) => void;
  className?: string;
}

interface ConversationItemProps {
  conversation: ConversationSummary;
  currentUserId: string;
  isSelected: boolean;
  onClick: () => void;
}

function ConversationItem({ conversation, currentUserId, isSelected, onClick }: ConversationItemProps) {
  const getConversationTitle = () => {
    if (conversation.title) return conversation.title;
    
    if (conversation.type === 'DIRECT') {
      const otherParticipant = conversation.participants.find(
        p => p.user.id !== currentUserId
      );
      return otherParticipant?.user.name || 'Unknown User';
    }
    
    return `Group Chat`;
  };

  const getConversationAvatar = () => {
    if (conversation.type === 'DIRECT') {
      const otherParticipant = conversation.participants.find(
        p => p.user.id !== currentUserId
      );
      return otherParticipant?.user.avatar || generateAvatarUrl(otherParticipant?.user.name || 'U');
    }
    
    return null; // Group conversations will use icon
  };

  const getConversationIcon = () => {
    switch (conversation.type) {
      case 'DIRECT':
        return null; // Uses avatar
      case 'GROUP':
        return <Users className="w-5 h-5" />;
      case 'CHANNEL':
        return <Hash className="w-5 h-5" />;
      default:
        return <MessageCircle className="w-5 h-5" />;
    }
  };

  const getLastMessagePreview = () => {
    if (!conversation.lastMessage) return 'No messages yet';
    
    const { content, type, senderName, senderId } = conversation.lastMessage;
    const isOwn = senderId === currentUserId;
    const prefix = isOwn ? 'You: ' : `${senderName}: `;
    
    switch (type) {
      case 'IMAGE':
        return `${prefix}📷 Image`;
      case 'FILE':
        return `${prefix}📎 File`;
      case 'SYSTEM':
        return content;
      default:
        return `${prefix}${truncateText(content, 50)}`;
    }
  };

  const getOnlineStatus = () => {
    if (conversation.type === 'DIRECT') {
      const otherParticipant = conversation.participants.find(
        p => p.user.id !== currentUserId
      );
      return otherParticipant?.user.status;
    }
    return null;
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors relative",
        isSelected 
          ? "bg-primary/10 border-l-4 border-primary" 
          : "hover:bg-accent",
        conversation.unreadCount > 0 && !isSelected && "bg-accent/50"
      )}
    >
      {/* Avatar or Icon */}
      <div className="relative flex-shrink-0">
        {conversation.type === 'DIRECT' ? (
          <div className="relative">
            <img
              src={getConversationAvatar()!}
              alt={getConversationTitle()}
              className="w-12 h-12 rounded-full"
            />
            {getOnlineStatus() && (
              <div className="absolute -bottom-1 -right-1">
                <UserStatus status={getOnlineStatus()!} size="sm" />
              </div>
            )}
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">
            {getConversationIcon()}
          </div>
        )}
      </div>

      {/* Conversation Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className={cn(
            "font-medium truncate",
            conversation.unreadCount > 0 && "font-semibold"
          )}>
            {getConversationTitle()}
          </h3>
          {conversation.lastMessageAt && (
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {formatDate(conversation.lastMessageAt)}
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <p className={cn(
            "text-sm text-muted-foreground truncate",
            conversation.unreadCount > 0 && "font-medium text-foreground"
          )}>
            {getLastMessagePreview()}
          </p>
          
          {conversation.unreadCount > 0 && (
            <NotificationBadge count={conversation.unreadCount} />
          )}
        </div>
      </div>

      {/* Pinned indicator */}
      {conversation.isPinned && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
        </div>
      )}
    </div>
  );
}

export function ConversationSidebar({
  conversations,
  currentConversationId,
  currentUserId,
  onSelectConversation,
  onCreateConversation,
  onSearchUsers,
  className
}: ConversationSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'direct' | 'groups'>('all');

  // Filter conversations based on search and tab
  const filteredConversations = conversations.filter(conversation => {
    // Search filter
    if (searchQuery) {
      const title = conversation.title || 
        (conversation.type === 'DIRECT' 
          ? conversation.participants.find(p => p.user.id !== currentUserId)?.user.name 
          : 'Group Chat'
        ) || '';
      
      const lastMessageContent = conversation.lastMessage?.content || '';
      
      if (!title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !lastMessageContent.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
    }

    // Tab filter
    switch (activeTab) {
      case 'direct':
        return conversation.type === 'DIRECT';
      case 'groups':
        return conversation.type === 'GROUP' || conversation.type === 'CHANNEL';
      default:
        return true;
    }
  });

  // Sort conversations (pinned first, then by last message time, then unread)
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    // Pinned conversations first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    // Then by unread count
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
    if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
    
    // Finally by last message time
    const aTime = new Date(a.lastMessageAt || 0).getTime();
    const bTime = new Date(b.lastMessageAt || 0).getTime();
    return bTime - aTime;
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearchUsers?.(query);
  };

  return (
    <div className={cn("flex flex-col h-full bg-card border-r", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Messages</h2>
          <button
            onClick={onCreateConversation}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
            title="New conversation"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mt-3">
          {[
            { key: 'all', label: 'All' },
            { key: 'direct', label: 'Direct' },
            { key: 'groups', label: 'Groups' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={cn(
                "px-3 py-1 text-sm rounded-md transition-colors",
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {sortedConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <MessageCircle className="w-8 h-8 mb-2" />
            <p className="text-sm">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
            {!searchQuery && (
              <button
                onClick={onCreateConversation}
                className="text-primary hover:underline text-sm mt-1"
              >
                Start a conversation
              </button>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sortedConversations.map(conversation => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                currentUserId={currentUserId}
                isSelected={conversation.id === currentConversationId}
                onClick={() => onSelectConversation(conversation.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{conversations.length} conversations</span>
          <button className="hover:text-foreground transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
