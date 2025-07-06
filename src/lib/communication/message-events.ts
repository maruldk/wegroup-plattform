import { EventEmitter } from 'events';

export interface MessageEvent {
  type: 'MESSAGE_SENT' | 'MESSAGE_RECEIVED' | 'MESSAGE_DELETED' | 'MESSAGE_EDITED' | 'TYPING_START' | 'TYPING_STOP' | 'USER_ONLINE' | 'USER_OFFLINE';
  data: any;
  timestamp: Date;
  userId?: string;
  conversationId?: string;
}

export class MessageEventSystem extends EventEmitter {
  private static instance: MessageEventSystem;

  private constructor() {
    super();
    this.setMaxListeners(100); // Increase max listeners for multiple components
  }

  public static getInstance(): MessageEventSystem {
    if (!MessageEventSystem.instance) {
      MessageEventSystem.instance = new MessageEventSystem();
    }
    return MessageEventSystem.instance;
  }

  // Message Events
  public emitMessageSent(messageId: string, conversationId: string, senderId: string, content: string) {
    const event: MessageEvent = {
      type: 'MESSAGE_SENT',
      data: { messageId, conversationId, senderId, content },
      timestamp: new Date(),
      userId: senderId,
      conversationId
    };
    this.emit('message:sent', event);
    this.emit('message:any', event);
  }

  public emitMessageReceived(messageId: string, conversationId: string, senderId: string, content: string) {
    const event: MessageEvent = {
      type: 'MESSAGE_RECEIVED',
      data: { messageId, conversationId, senderId, content },
      timestamp: new Date(),
      userId: senderId,
      conversationId
    };
    this.emit('message:received', event);
    this.emit('message:any', event);
  }

  public emitMessageDeleted(messageId: string, conversationId: string, userId: string) {
    const event: MessageEvent = {
      type: 'MESSAGE_DELETED',
      data: { messageId, conversationId, userId },
      timestamp: new Date(),
      userId,
      conversationId
    };
    this.emit('message:deleted', event);
    this.emit('message:any', event);
  }

  public emitMessageEdited(messageId: string, conversationId: string, userId: string, newContent: string) {
    const event: MessageEvent = {
      type: 'MESSAGE_EDITED',
      data: { messageId, conversationId, userId, newContent },
      timestamp: new Date(),
      userId,
      conversationId
    };
    this.emit('message:edited', event);
    this.emit('message:any', event);
  }

  // Typing Events
  public emitTypingStart(conversationId: string, userId: string, userName: string) {
    const event: MessageEvent = {
      type: 'TYPING_START',
      data: { conversationId, userId, userName },
      timestamp: new Date(),
      userId,
      conversationId
    };
    this.emit('typing:start', event);
    this.emit('typing:any', event);
  }

  public emitTypingStop(conversationId: string, userId: string, userName: string) {
    const event: MessageEvent = {
      type: 'TYPING_STOP',
      data: { conversationId, userId, userName },
      timestamp: new Date(),
      userId,
      conversationId
    };
    this.emit('typing:stop', event);
    this.emit('typing:any', event);
  }

  // User Status Events
  public emitUserOnline(userId: string, userName: string) {
    const event: MessageEvent = {
      type: 'USER_ONLINE',
      data: { userId, userName },
      timestamp: new Date(),
      userId
    };
    this.emit('user:online', event);
    this.emit('user:status', event);
  }

  public emitUserOffline(userId: string, userName: string) {
    const event: MessageEvent = {
      type: 'USER_OFFLINE',
      data: { userId, userName },
      timestamp: new Date(),
      userId
    };
    this.emit('user:offline', event);
    this.emit('user:status', event);
  }

  // Event Listeners
  public onMessageSent(callback: (event: MessageEvent) => void) {
    this.on('message:sent', callback);
  }

  public onMessageReceived(callback: (event: MessageEvent) => void) {
    this.on('message:received', callback);
  }

  public onMessageDeleted(callback: (event: MessageEvent) => void) {
    this.on('message:deleted', callback);
  }

  public onMessageEdited(callback: (event: MessageEvent) => void) {
    this.on('message:edited', callback);
  }

  public onAnyMessage(callback: (event: MessageEvent) => void) {
    this.on('message:any', callback);
  }

  public onTypingStart(callback: (event: MessageEvent) => void) {
    this.on('typing:start', callback);
  }

  public onTypingStop(callback: (event: MessageEvent) => void) {
    this.on('typing:stop', callback);
  }

  public onAnyTyping(callback: (event: MessageEvent) => void) {
    this.on('typing:any', callback);
  }

  public onUserOnline(callback: (event: MessageEvent) => void) {
    this.on('user:online', callback);
  }

  public onUserOffline(callback: (event: MessageEvent) => void) {
    this.on('user:offline', callback);
  }

  public onUserStatus(callback: (event: MessageEvent) => void) {
    this.on('user:status', callback);
  }

  // Cleanup
  public removeAllMessageListeners() {
    this.removeAllListeners('message:sent');
    this.removeAllListeners('message:received');
    this.removeAllListeners('message:deleted');
    this.removeAllListeners('message:edited');
    this.removeAllListeners('message:any');
  }

  public removeAllTypingListeners() {
    this.removeAllListeners('typing:start');
    this.removeAllListeners('typing:stop');
    this.removeAllListeners('typing:any');
  }

  public removeAllUserListeners() {
    this.removeAllListeners('user:online');
    this.removeAllListeners('user:offline');
    this.removeAllListeners('user:status');
  }

  public cleanup() {
    this.removeAllListeners();
  }
}

// Export singleton instance
export const messageEvents = MessageEventSystem.getInstance();
