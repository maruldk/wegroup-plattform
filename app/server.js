const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');
const jwt = require('jsonwebtoken');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;
const wsPort = process.env.WS_PORT || 3001;

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// Store active connections and rooms
const activeConnections = new Map();
const conversationRooms = new Map();
const typingUsers = new Map();

// Rate limiting
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMITS = {
  send_message: 60,
  typing_start: 30,
  join_conversation: 20
};

function checkRateLimit(userId, action) {
  const key = `${userId}:${action}`;
  const now = Date.now();
  const userLimits = rateLimits.get(key) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
  
  if (now > userLimits.resetTime) {
    userLimits.count = 0;
    userLimits.resetTime = now + RATE_LIMIT_WINDOW;
  }
  
  if (userLimits.count >= RATE_LIMITS[action]) {
    return false;
  }
  
  userLimits.count++;
  rateLimits.set(key, userLimits);
  return true;
}

function authenticateSocket(socket, data) {
  try {
    if (!data.token || !data.userId) {
      throw new Error('Missing authentication data');
    }
    
    // In production, verify JWT token
    // const decoded = jwt.verify(data.token, process.env.NEXTAUTH_SECRET);
    // if (decoded.sub !== data.userId) {
    //   throw new Error('Invalid token');
    // }
    
    socket.userId = data.userId;
    socket.authenticated = true;
    
    return true;
  } catch (error) {
    console.error('Authentication error:', error);
    return false;
  }
}

app.prepare().then(() => {
  // Create HTTP server for Next.js
  const server = createServer(async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });
  
  // Create separate HTTP server for WebSocket
  const wsServer = createServer();
  
  // Initialize Socket.io
  const io = new Server(wsServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });
  
  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    const userId = socket.handshake.auth.userId;
    
    if (!token || !userId) {
      return next(new Error('Authentication required'));
    }
    
    socket.userId = userId;
    next();
  });
  
  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);
    
    // Store active connection
    activeConnections.set(socket.userId, {
      socketId: socket.id,
      userId: socket.userId,
      connectedAt: new Date(),
      lastActivity: new Date()
    });
    
    // Broadcast user online status
    socket.broadcast.emit('user_online', {
      userId: socket.userId,
      connectedAt: new Date().toISOString()
    });
    
    // Handle authentication
    socket.on('authenticate', (data) => {
      if (authenticateSocket(socket, data)) {
        socket.emit('authenticated', {
          userId: socket.userId,
          connectedAt: new Date().toISOString()
        });
      } else {
        socket.emit('authentication_error', {
          message: 'Authentication failed'
        });
        socket.disconnect();
      }
    });
    
    // Handle joining conversations
    socket.on('join_conversation', (data) => {
      if (!socket.authenticated) {
        return socket.emit('error', { code: 'AUTH_REQUIRED', message: 'Authentication required' });
      }
      
      if (!checkRateLimit(socket.userId, 'join_conversation')) {
        return socket.emit('error', { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' });
      }
      
      const { conversationId } = data;
      
      if (!conversationId) {
        return socket.emit('error', { code: 'INVALID_DATA', message: 'Conversation ID required' });
      }
      
      // Join the conversation room
      socket.join(conversationId);
      
      // Track room membership
      if (!conversationRooms.has(conversationId)) {
        conversationRooms.set(conversationId, new Set());
      }
      conversationRooms.get(conversationId).add(socket.userId);
      
      // Notify other participants
      socket.to(conversationId).emit('user_joined', {
        conversationId,
        userId: socket.userId,
        joinedAt: new Date().toISOString()
      });
      
      // Confirm join
      socket.emit('conversation_joined', {
        conversationId,
        participants: Array.from(conversationRooms.get(conversationId))
      });
      
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    });
    
    // Handle leaving conversations
    socket.on('leave_conversation', (data) => {
      const { conversationId } = data;
      
      if (conversationId) {
        socket.leave(conversationId);
        
        // Remove from room tracking
        if (conversationRooms.has(conversationId)) {
          conversationRooms.get(conversationId).delete(socket.userId);
        }
        
        // Notify other participants
        socket.to(conversationId).emit('user_left', {
          conversationId,
          userId: socket.userId,
          leftAt: new Date().toISOString()
        });
        
        console.log(`User ${socket.userId} left conversation ${conversationId}`);
      }
    });
    
    // Handle sending messages
    socket.on('send_message', (data) => {
      if (!socket.authenticated) {
        return socket.emit('error', { code: 'AUTH_REQUIRED', message: 'Authentication required' });
      }
      
      if (!checkRateLimit(socket.userId, 'send_message')) {
        return socket.emit('error', { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many messages' });
      }
      
      const { conversationId, content, type = 'TEXT' } = data;
      
      if (!conversationId || !content) {
        return socket.emit('error', { code: 'INVALID_DATA', message: 'Missing required fields' });
      }
      
      if (content.length > 2000) {
        return socket.emit('error', { code: 'MESSAGE_TOO_LARGE', message: 'Message too long' });
      }
      
      // Create message object
      const message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conversationId,
        content,
        type,
        senderId: socket.userId,
        createdAt: new Date().toISOString(),
        isEdited: false
      };
      
      // Broadcast to all participants in the conversation
      io.to(conversationId).emit('new_message', message);
      
      console.log(`Message sent in conversation ${conversationId} by user ${socket.userId}`);
    });
    
    // Handle typing indicators
    socket.on('typing_start', (data) => {
      if (!socket.authenticated) return;
      
      if (!checkRateLimit(socket.userId, 'typing_start')) {
        return;
      }
      
      const { conversationId } = data;
      
      if (!conversationId) return;
      
      // Track typing user
      const typingKey = `${conversationId}:${socket.userId}`;
      if (typingUsers.has(typingKey)) {
        clearTimeout(typingUsers.get(typingKey));
      }
      
      // Auto-stop typing after 3 seconds
      const timeout = setTimeout(() => {
        socket.to(conversationId).emit('user_stopped_typing', {
          conversationId,
          userId: socket.userId
        });
        typingUsers.delete(typingKey);
      }, 3000);
      
      typingUsers.set(typingKey, timeout);
      
      // Notify other participants
      socket.to(conversationId).emit('user_typing', {
        conversationId,
        userId: socket.userId
      });
    });
    
    socket.on('typing_stop', (data) => {
      const { conversationId } = data;
      
      if (!conversationId) return;
      
      const typingKey = `${conversationId}:${socket.userId}`;
      if (typingUsers.has(typingKey)) {
        clearTimeout(typingUsers.get(typingKey));
        typingUsers.delete(typingKey);
      }
      
      // Notify other participants
      socket.to(conversationId).emit('user_stopped_typing', {
        conversationId,
        userId: socket.userId
      });
    });
    
    // Handle message reactions
    socket.on('add_reaction', (data) => {
      if (!socket.authenticated) return;
      
      const { messageId, conversationId, emoji } = data;
      
      if (!messageId || !conversationId || !emoji) {
        return socket.emit('error', { code: 'INVALID_DATA', message: 'Missing required fields' });
      }
      
      // Broadcast reaction to conversation participants
      io.to(conversationId).emit('reaction_added', {
        messageId,
        conversationId,
        userId: socket.userId,
        emoji,
        createdAt: new Date().toISOString()
      });
    });
    
    socket.on('remove_reaction', (data) => {
      if (!socket.authenticated) return;
      
      const { messageId, conversationId, emoji } = data;
      
      if (!messageId || !conversationId || !emoji) {
        return socket.emit('error', { code: 'INVALID_DATA', message: 'Missing required fields' });
      }
      
      // Broadcast reaction removal to conversation participants
      io.to(conversationId).emit('reaction_removed', {
        messageId,
        conversationId,
        userId: socket.userId,
        emoji
      });
    });
    
    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`User ${socket.userId} disconnected: ${reason}`);
      
      // Clean up active connection
      activeConnections.delete(socket.userId);
      
      // Clean up typing indicators
      for (const [key, timeout] of typingUsers.entries()) {
        if (key.endsWith(`:${socket.userId}`)) {
          clearTimeout(timeout);
          typingUsers.delete(key);
          
          const conversationId = key.split(':')[0];
          socket.to(conversationId).emit('user_stopped_typing', {
            conversationId,
            userId: socket.userId
          });
        }
      }
      
      // Remove from all conversation rooms
      for (const [conversationId, participants] of conversationRooms.entries()) {
        if (participants.has(socket.userId)) {
          participants.delete(socket.userId);
          
          // Notify other participants
          socket.to(conversationId).emit('user_left', {
            conversationId,
            userId: socket.userId,
            leftAt: new Date().toISOString()
          });
        }
      }
      
      // Broadcast user offline status
      socket.broadcast.emit('user_offline', {
        userId: socket.userId,
        disconnectedAt: new Date().toISOString(),
        reason
      });
    });
    
    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.userId}:`, error);
    });
  });
  
  // Start servers
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Next.js ready on http://${hostname}:${port}`);
  });
  
  wsServer.listen(wsPort, (err) => {
    if (err) throw err;
    console.log(`> WebSocket server ready on http://${hostname}:${wsPort}`);
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      wsServer.close(() => {
        process.exit(0);
      });
    });
  });
  
  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
      wsServer.close(() => {
        process.exit(0);
      });
    });
  });
});