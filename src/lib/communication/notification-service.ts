import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface NotificationData {
  id: string;
  userId: string;
  type: 'MESSAGE' | 'MENTION' | 'REACTION' | 'SYSTEM';
  title: string;
  content: string;
  isRead: boolean;
  data?: any;
  createdAt: Date;
}

export interface CreateNotificationInput {
  userId: string;
  type: 'MESSAGE' | 'MENTION' | 'REACTION' | 'SYSTEM';
  title: string;
  content: string;
  data?: any;
}

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Create a new notification
  public async createNotification(input: CreateNotificationInput): Promise<NotificationData> {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          content: input.content,
          data: input.data || null,
        }
      });

      return {
        id: notification.id,
        userId: notification.userId,
        type: notification.type as NotificationData['type'],
        title: notification.title,
        content: notification.content,
        isRead: notification.isRead,
        data: notification.data,
        createdAt: notification.createdAt,
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  // Get notifications for a user
  public async getUserNotifications(userId: string, limit: number = 50, offset: number = 0): Promise<NotificationData[]> {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      return notifications.map(notification => ({
        id: notification.id,
        userId: notification.userId,
        type: notification.type as NotificationData['type'],
        title: notification.title,
        content: notification.content,
        isRead: notification.isRead,
        data: notification.data,
        createdAt: notification.createdAt,
      }));
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw new Error('Failed to fetch notifications');
    }
  }

  // Get unread notification count
  public async getUnreadCount(userId: string): Promise<number> {
    try {
      return await prisma.notification.count({
        where: {
          userId,
          isRead: false,
        }
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Mark notification as read
  public async markAsRead(notificationId: string): Promise<void> {
    try {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  // Mark all notifications as read for a user
  public async markAllAsRead(userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: { isRead: true }
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  // Delete notification
  public async deleteNotification(notificationId: string): Promise<void> {
    try {
      await prisma.notification.delete({
        where: { id: notificationId }
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error('Failed to delete notification');
    }
  }

  // Delete old notifications (cleanup)
  public async deleteOldNotifications(olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          },
          isRead: true, // Only delete read notifications
        }
      });

      return result.count;
    } catch (error) {
      console.error('Error deleting old notifications:', error);
      return 0;
    }
  }

  // Create message notification
  public async createMessageNotification(
    recipientId: string,
    senderName: string,
    conversationId: string,
    messageId: string,
    messagePreview: string
  ): Promise<NotificationData> {
    return this.createNotification({
      userId: recipientId,
      type: 'MESSAGE',
      title: `New message from ${senderName}`,
      content: messagePreview.length > 100 ? messagePreview.substring(0, 100) + '...' : messagePreview,
      data: {
        conversationId,
        messageId,
        senderId: recipientId,
      }
    });
  }

  // Create mention notification
  public async createMentionNotification(
    mentionedUserId: string,
    mentionerName: string,
    conversationId: string,
    messageId: string
  ): Promise<NotificationData> {
    return this.createNotification({
      userId: mentionedUserId,
      type: 'MENTION',
      title: `${mentionerName} mentioned you`,
      content: `You were mentioned in a conversation`,
      data: {
        conversationId,
        messageId,
        mentionerId: mentionedUserId,
      }
    });
  }

  // Create reaction notification
  public async createReactionNotification(
    messageOwnerId: string,
    reactorName: string,
    emoji: string,
    messageId: string,
    conversationId: string
  ): Promise<NotificationData> {
    return this.createNotification({
      userId: messageOwnerId,
      type: 'REACTION',
      title: `${reactorName} reacted to your message`,
      content: `${reactorName} reacted with ${emoji}`,
      data: {
        conversationId,
        messageId,
        emoji,
        reactorName,
      }
    });
  }

  // Create system notification
  public async createSystemNotification(
    userId: string,
    title: string,
    content: string,
    data?: any
  ): Promise<NotificationData> {
    return this.createNotification({
      userId,
      type: 'SYSTEM',
      title,
      content,
      data,
    });
  }

  // Batch create notifications
  public async createBatchNotifications(notifications: CreateNotificationInput[]): Promise<void> {
    try {
      await prisma.notification.createMany({
        data: notifications.map(notif => ({
          userId: notif.userId,
          type: notif.type,
          title: notif.title,
          content: notif.content,
          data: notif.data || null,
        }))
      });
    } catch (error) {
      console.error('Error creating batch notifications:', error);
      throw new Error('Failed to create batch notifications');
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
