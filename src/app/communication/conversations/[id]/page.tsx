
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChatWindow, type Conversation, type Message } from '@/components/communication/chat-window';
import { ArrowLeft, Settings, Users, Phone, Video } from 'lucide-react';

// Mock data - in a real app, this would come from API
const mockUser = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com',
  avatar: undefined,
  status: 'ONLINE' as const
};

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Array<{ id: string; name: string }>>([]);

  // Mock conversation data
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockConversation: Conversation = {
        id: conversationId,
        title: conversationId === 'conv-1' ? undefined : 'Project Team',
        type: conversationId === 'conv-1' ? 'DIRECT' : 'GROUP',
        isGroup: conversationId !== 'conv-1',
        participants: conversationId === 'conv-1' ? [
          {
            id: 'part-1',
            user: {
              id: 'user-2',
              name: 'Alice Smith',
              email: 'alice@example.com',
              avatar: undefined,
              status: 'ONLINE'
            },
            role: 'MEMBER'
          },
          {
            id: 'part-2',
            user: mockUser,
            role: 'MEMBER'
          }
        ] : [
          {
            id: 'part-3',
            user: mockUser,
            role: 'ADMIN'
          },
          {
            id: 'part-4',
            user: {
              id: 'user-3',
              name: 'Bob Johnson',
              email: 'bob@example.com',
              avatar: undefined,
              status: 'AWAY'
            },
            role: 'MEMBER'
          },
          {
            id: 'part-5',
            user: {
              id: 'user-4',
              name: 'Carol Wilson',
              email: 'carol@example.com',
              avatar: undefined,
              status: 'ONLINE'
            },
            role: 'MEMBER'
          }
        ]
      };

      const mockMessages: Message[] = [
        {
          id: 'msg-1',
          content: conversationId === 'conv-1' 
            ? 'Hey, how are you doing?' 
            : 'Welcome to the project team chat!',
          senderId: conversationId === 'conv-1' ? 'user-2' : 'user-3',
          conversationId,
          type: 'TEXT',
          createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          sender: conversationId === 'conv-1' ? {
            id: 'user-2',
            name: 'Alice Smith',
            email: 'alice@example.com',
            avatar: undefined
          } : {
            id: 'user-3',
            name: 'Bob Johnson',
            email: 'bob@example.com',
            avatar: undefined
          }
        },
        {
          id: 'msg-2',
          content: conversationId === 'conv-1' 
            ? 'I\'m doing great! Just working on the new communication module.' 
            : 'Thanks! Excited to work with everyone.',
          senderId: 'user-1',
          conversationId,
          type: 'TEXT',
          createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
          sender: mockUser
        }
      ];

      setConversation(mockConversation);
      setMessages(mockMessages);
      setIsLoading(false);
    }, 500);
  }, [conversationId]);

  const handleSendMessage = (content: string, type: 'TEXT' | 'IMAGE' | 'FILE' = 'TEXT') => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      content,
      senderId: mockUser.id,
      conversationId,
      type,
      createdAt: new Date().toISOString(),
      sender: mockUser
    };

    setMessages(prev => [...prev, newMessage]);
  };

  const handleEditMessage = (messageId: string, newContent: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content: newContent, isEdited: true }
        : msg
    ));
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const handleAddReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = msg.reactions || [];
        const existingReaction = reactions.find(r => r.emoji === emoji && r.userId === mockUser.id);
        
        if (!existingReaction) {
          return {
            ...msg,
            reactions: [...reactions, {
              id: `reaction-${Date.now()}`,
              emoji,
              userId: mockUser.id
            }]
          };
        }
      }
      return msg;
    }));
  };

  const handleRemoveReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = msg.reactions || [];
        return {
          ...msg,
          reactions: reactions.filter(r => !(r.emoji === emoji && r.userId === mockUser.id))
        };
      }
      return msg;
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <h3 className="text-xl font-semibold mb-2">Conversation not found</h3>
        <p className="mb-4">The conversation you're looking for doesn't exist or you don't have access to it.</p>
        <button
          onClick={() => router.push('/communication')}
          className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Conversations</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-card">
        <button
          onClick={() => router.push('/communication')}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="flex-1 text-center">
          <h2 className="font-semibold">
            {conversation.title || 
             (conversation.type === 'DIRECT' 
               ? conversation.participants.find(p => p.user.id !== mockUser.id)?.user.name 
               : 'Group Chat'
             )
            }
          </h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-accent rounded-lg transition-colors">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-accent rounded-lg transition-colors">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-accent rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1">
        <ChatWindow
          conversation={conversation}
          currentUserId={mockUser.id}
          messages={messages}
          onSendMessage={handleSendMessage}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
          onAddReaction={handleAddReaction}
          onRemoveReaction={handleRemoveReaction}
          isLoading={false}
          typingUsers={typingUsers}
        />
      </div>
    </div>
  );
}
