import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { SessionProvider } from 'next-auth/react';
import { WebSocketProvider } from '@/components/communication/websocket-provider';
import { createMockSocket } from '../mocks/socket-mock';

// Mock session data
const mockSession = {
  user: {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    image: null
  },
  accessToken: 'mock-access-token',
  expires: '2024-12-31'
};

// Custom render with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const mockSocket = createMockSocket();
  
  return (
    <SessionProvider session={mockSession}>
      <WebSocketProvider>
        {children}
      </WebSocketProvider>
    </SessionProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Test data factories
export const createMockMessage = (overrides = {}) => ({
  id: 'msg-1',
  content: 'Test message',
  senderId: 'user-1',
  conversationId: 'conv-1',
  type: 'TEXT' as const,
  createdAt: new Date().toISOString(),
  isEdited: false,
  sender: {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    avatar: null
  },
  attachments: [],
  reactions: [],
  ...overrides
});

export const createMockConversation = (overrides = {}) => ({
  id: 'conv-1',
  title: 'Test Conversation',
  type: 'DIRECT' as const,
  isGroup: false,
  participants: [
    {
      id: 'participant-1',
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        avatar: null
      },
      role: 'MEMBER' as const,
      joinedAt: new Date().toISOString()
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  lastMessage: null,
  unreadCount: 0,
  ...overrides
});

export const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  avatar: null,
  status: 'online' as const,
  lastSeen: new Date().toISOString(),
  ...overrides
});

// Wait for async operations
export const waitForSocketEvent = (socket: any, event: string, timeout = 1000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for ${event}`));
    }, timeout);

    socket.on(event, (data: any) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
};

// Mock API responses
export const mockApiResponse = (data: any, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data))
  });
};

// Mock fetch
export const mockFetch = (responses: any[]) => {
  let callCount = 0;
  return jest.fn(() => {
    const response = responses[callCount] || responses[responses.length - 1];
    callCount++;
    return mockApiResponse(response);
  });
};

// Test utilities for WebSocket events
export const simulateWebSocketEvent = (socket: any, event: string, data: any) => {
  socket.trigger(event, data);
};

// Cleanup helper
export const cleanup = () => {
  jest.clearAllMocks();
};

// Mock environment variables
export const mockEnvVars = (vars: Record<string, string>) => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    process.env = { ...originalEnv, ...vars };
  });
  
  afterEach(() => {
    process.env = originalEnv;
  });
};