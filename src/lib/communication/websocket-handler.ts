import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SocketUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface MessageData {
  id: string;
  content: string;
  conversationId: string;
  senderId: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  createdAt: string;
  sender: SocketUser;
}

export interface TypingData {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export class WebSocketHandler {
  private io: SocketIOServer;
  private userSockets: Map<string, string> = new Map(); // userId -> socketId
  private socketUsers: Map<string, SocketUser> = new Map(); // socketId -> user

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Handle user authentication
      socket.on('authenticate', async (userData: SocketUser) => {
        this.userSockets.set(userData.id, socket.id);
        this.socketUsers.set(socket.id, userData);
        
        // Update user status to online
        await this.updateUserStatus(userData.id, 'ONLINE');
        
        // Join user to their conversations
        await this.joinUserConversations(socket, userData.id);
        
        // Notify others about user coming online
        this.broadcastUserStatus(userData.id, 'ONLINE');
      });

      // Handle joining specific conversation
      socket.on('join-conversation', (conversationId: string) => {
        socket.join(`conversation-${conversationId}`);
        console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
      });

      // Handle leaving conversation
      socket.on('leave-conversation', (conversationId: string) => {
        socket.leave(`conversation-${conversationId}`);
        console.log(`Socket ${socket.id} left conversation ${conversationId}`);
      });

      // Handle new message
      socket.on('send-message', async (messageData: Omit<MessageData, 'id' | 'createdAt' | 'sender'>) => {
        try {
          const user = this.socketUsers.get(socket.id);
          if (!user) return;

          // Save message to database
          const message = await prisma.message.create({
            data: {
              content: messageData.content,
              type: messageData.type,
              conversationId: messageData.conversationId,
              senderId: messageData.senderId,
            },
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                }
              }
            }
          });

          // Update conversation last message time
          await prisma.conversation.update({
            where: { id: messageData.conversationId },
            data: { lastMessageAt: new Date() }
          });

          const fullMessage: MessageData = {
            id: message.id,
            content: message.content,
            conversationId: message.conversationId,
            senderId: message.senderId,
            type: message.type as MessageData['type'],
            createdAt: message.createdAt.toISOString(),
            sender: {
              id: message.sender.id,
              name: message.sender.name || '',
              email: message.sender.email,
              avatar: message.sender.avatar || undefined,
            }
          };

          // Broadcast message to conversation participants
          this.io.to(`conversation-${messageData.conversationId}`).emit('new-message', fullMessage);

          // Send notifications to offline users
          await this.sendMessageNotifications(messageData.conversationId, message.id, user.id);

        } catch (error) {
          console.error('Error sending message:', error);
          socket.emit('message-error', { error: 'Failed to send message' });
        }
      });

      // Handle typing indicators
      socket.on('typing', (data: TypingData) => {
        socket.to(`conversation-${data.conversationId}`).emit('user-typing', data);
      });

      // Handle message reactions
      socket.on('add-reaction', async (data: { messageId: string; emoji: string; userId: string }) => {
        try {
          await prisma.messageReaction.upsert({
            where: {
              messageId_userId_emoji: {
                messageId: data.messageId,
                userId: data.userId,
                emoji: data.emoji,
              }
            },
            update: {},
            create: {
              messageId: data.messageId,
              userId: data.userId,
              emoji: data.emoji,
            }
          });

          const message = await prisma.message.findUnique({
            where: { id: data.messageId },
            select: { conversationId: true }
          });

          if (message) {
            this.io.to(`conversation-${message.conversationId}`).emit('reaction-added', data);
          }
        } catch (error) {
          console.error('Error adding reaction:', error);
        }
      });

      // Handle disconnect
      socket.on('disconnect', async () => {
        const user = this.socketUsers.get(socket.id);
        if (user) {
          // Update user status to offline
          await this.updateUserStatus(user.id, 'OFFLINE');
          
          // Clean up maps
          this.userSockets.delete(user.id);
          this.socketUsers.delete(socket.id);
          
          // Notify others about user going offline
          this.broadcastUserStatus(user.id, 'OFFLINE');
        }
        console.log('User disconnected:', socket.id);
      });
    });
  }

  private async joinUserConversations(socket: any, userId: string) {
    try {
      const conversations = await prisma.conversationParticipant.findMany({
        where: { userId },
        select: { conversationId: true }
      });

      conversations.forEach(({ conversationId }) => {
        socket.join(`conversation-${conversationId}`);
      });
    } catch (error) {
      console.error('Error joining user conversations:', error);
    }
  }

  private async updateUserStatus(userId: string, status: 'ONLINE' | 'OFFLINE' | 'AWAY' | 'BUSY') {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { 
          status,
          lastSeen: new Date()
        }
      });
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  }

  private broadcastUserStatus(userId: string, status: string) {
    this.io.emit('user-status-changed', { userId, status });
  }

  private async sendMessageNotifications(conversationId: string, messageId: string, senderId: string) {
    try {
      // Get conversation participants (excluding sender)
      const participants = await prisma.conversationParticipant.findMany({
        where: {
          conversationId,
          userId: { not: senderId }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              status: true
            }
          }
        }
      });

      // Create notifications for offline users
      const offlineUsers = participants.filter(p => p.user.status === 'OFFLINE');
      
      if (offlineUsers.length > 0) {
        await prisma.notification.createMany({
          data: offlineUsers.map(p => ({
            userId: p.user.id,
            type: 'MESSAGE',
            title: 'New Message',
            content: `You have a new message from ${this.socketUsers.get(this.userSockets.get(senderId) || '')?.name || 'Someone'}`,
            data: {
              messageId,
              conversationId,
              senderId
            }
          }))
        });
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  }

  public getIO() {
    return this.io;
  }

  public getUserSocket(userId: string): string | undefined {
    return this.userSockets.get(userId);
  }

  public getSocketUser(socketId: string): SocketUser | undefined {
    return this.socketUsers.get(socketId);
  }
}
