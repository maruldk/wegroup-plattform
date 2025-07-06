
'use client';

import React, { useState, useEffect } from 'react';
import { ConversationSidebar, type ConversationSummary } from '@/components/communication/conversation-sidebar';
import { ChatWindow, type Conversation, type Message } from '@/components/communication/chat-window';
import { MessageCircle, Users, Plus } from 'lucide-react';

// Mock data for demonstration
const mockUser = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com',
  avatar: undefined,
  status: 'ONLINE' as const
};

const mockConversations: ConversationSummary[] = [
  {
    id: 'conv-1',
    type: 'DIRECT',
    isGroup: false,
    participants: [
      {
        id: 'part-1',
        user: {
          id: 'user-2',
          name: 'Alice Smith',
          email: 'alice@example.com',
          avatar: undefined,
          status: 'ONLINE'
        }
      },
      {
        id: 'part-2',
        user: mockUser
      }
    ],
    lastMessage: {
      id: 'msg-1',
      content: 'Hey, how are you doing?',
      senderId: 'user-2',
      senderName: 'Alice Smith',
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      type: 'TEXT'
    },
    unreadCount: 2,
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 5).toISOString()
  },
  {
    id: 'conv-2',
    title: 'Project Team',
    type: 'GROUP',
    isGroup: true,
    participants: [
      {
        id: 'part-3',
        user: mockUser
      },
      {
        id: 'part-4',
        user: {
          id: 'user-3',
          name: 'Bob Johnson',
          email: 'bob@example.com',
          avatar: undefined,
          status: 'AWAY'
        }
      },
      {
        id: 'part-5',
        user: {
          id: 'user-4',
          name: 'Carol Wilson',
          email: 'carol@example.com',
          avatar: undefined,
          status: 'ONLINE'
        }
      }
    ],
    lastMessage: {
      id: 'msg-2',
      content: 'The project deadline is next week',
      senderId: 'user-3',
      senderName: 'Bob Johnson',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      type: 'TEXT'
    },
    unreadCount: 0,
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  }
];

const mockMessages: Message[] = [
  {
    id: 'msg-1',
    content: 'Hey, how are you doing?',
    senderId: 'user-2',
    conversationId: 'conv-1',
    type: 'TEXT',
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    sender: {
      id: 'user-2',
      name: 'Alice Smith',
      email: 'alice@example.com',
      avatar: undefined
    }
  },
  {
    id: 'msg-2',
    content: 'I\'m doing great! Just working on the new communication module.',
    senderId: 'user-1',
    conversationId: 'conv-1',
    type: 'TEXT',
    createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    sender: {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: undefined
    }
  },
  {
    id: 'msg-3',
    content: 'That sounds exciting! How is it coming along?',
    senderId: 'user-2',
    conversationId: 'conv-1',
    type: 'TEXT',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    sender: {
      id: 'user-2',
      name: 'Alice Smith',
      email: 'alice@example.com',
      avatar: undefined
    }
  }
];

export default function CommunicationPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string>('conv-1');
  const [conversations, setConversations] = useState<ConversationSummary[]>(mockConversations);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [isLoading, setIsLoading] = useState(false);

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  // Convert ConversationSummary to Conversation for ChatWindow
  const chatConversation: Conversation | undefined = selectedConversation ? {
    id: selectedConversation.id,
    title: selectedConversation.title,
    type: selectedConversation.type,
    isGroup: selectedConversation.isGroup,
    participants: selectedConversation.participants.map(p => ({
      id: p.id,
      user: p.user,
      role: 'MEMBER' as const
    })),
    lastMessageAt: selectedConversation.lastMessageAt
  } : undefined;

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    // In a real app, you would fetch messages for this conversation
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  const handleSendMessage = (content: string, type: 'TEXT' | 'IMAGE' | 'FILE' = 'TEXT') => {
    if (!selectedConversationId) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      content,
      senderId: mockUser.id,
      conversationId: selectedConversationId,
      type,
      createdAt: new Date().toISOString(),
      sender: mockUser
    };

    setMessages(prev => [...prev, newMessage]);

    // Update conversation's last message
    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversationId 
        ? {
            ...conv,
            lastMessage: {
              id: newMessage.id,
              content: newMessage.content,
              senderId: newMessage.senderId,
              senderName: newMessage.sender.name,
              createdAt: newMessage.createdAt,
              type: newMessage.type
            },
            lastMessageAt: newMessage.createdAt
          }
        : conv
    ));
  };

  const handleCreateConversation = () => {
    // In a real app, this would open a modal to select users and create a conversation
    console.log('Create new conversation');
  };

  const handleSearchUsers = (query: string) => {
    // In a real app, this would search for users to start conversations with
    console.log('Search users:', query);
  };

  // Filter messages for selected conversation
  const conversationMessages = messages.filter(m => m.conversationId === selectedConversationId);

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0">
        <ConversationSidebar
          conversations={conversations}
          currentConversationId={selectedConversationId}
          currentUserId={mockUser.id}
          onSelectConversation={handleSelectConversation}
          onCreateConversation={handleCreateConversation}
          onSearchUsers={handleSearchUsers}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1">
        {chatConversation ? (
          <ChatWindow
            conversation={chatConversation}
            currentUserId={mockUser.id}
            messages={conversationMessages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            typingUsers={[]}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageCircle className="w-16 h-16 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Welcome to WeGroup Communication</h3>
            <p className="text-center max-w-md mb-6">
              Select a conversation from the sidebar to start chatting, or create a new conversation to connect with your team.
            </p>
            <button
              onClick={handleCreateConversation}
              className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Start New Conversation</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
