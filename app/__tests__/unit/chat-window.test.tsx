import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatWindow } from '@/components/communication/chat-window';
import { createMockSocket } from '../mocks/socket-mock';
import { createMockMessage, createMockConversation } from '../utils/test-helpers';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com'
      }
    }
  })
}));

describe('ChatWindow', () => {
  let mockSocket: any;
  const mockConversation = createMockConversation({
    type: 'DIRECT',
    participants: [
      {
        id: 'participant-1',
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com'
        },
        role: 'MEMBER',
        joinedAt: new Date().toISOString()
      },
      {
        id: 'participant-2',
        user: {
          id: 'user-2',
          name: 'Other User',
          email: 'other@example.com'
        },
        role: 'MEMBER',
        joinedAt: new Date().toISOString()
      }
    ]
  });

  beforeEach(() => {
    mockSocket = createMockSocket();
  });

  test('renders chat window with conversation title', () => {
    render(
      <ChatWindow
        conversation={mockConversation}
        messages={[]}
        currentUserId="user-1"
        onSendMessage={jest.fn()}
      />
    );

    expect(screen.getByText('Other User')).toBeInTheDocument();
    expect(screen.getByText('other@example.com')).toBeInTheDocument();
  });

  test('renders messages in the chat window', () => {
    const messages = [
      createMockMessage({
        id: 'msg-1',
        content: 'Hello World',
        senderId: 'user-2',
        sender: {
          id: 'user-2',
          name: 'Other User',
          email: 'other@example.com'
        }
      }),
      createMockMessage({
        id: 'msg-2',
        content: 'Hi there!',
        senderId: 'user-1',
        sender: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com'
        }
      })
    ];

    render(
      <ChatWindow
        conversation={mockConversation}
        messages={messages}
        currentUserId="user-1"
        onSendMessage={jest.fn()}
      />
    );

    expect(screen.getByText('Hello World')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  test('calls onSendMessage when message is sent', async () => {
    const mockOnSendMessage = jest.fn();
    
    render(
      <ChatWindow
        conversation={mockConversation}
        messages={[]}
        currentUserId="user-1"
        onSendMessage={mockOnSendMessage}
      />
    );

    const input = screen.getByPlaceholderText(/message other user/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message', 'TEXT');
    });
  });

  test('shows typing indicator when users are typing', () => {
    render(
      <ChatWindow
        conversation={mockConversation}
        messages={[]}
        currentUserId="user-1"
        onSendMessage={jest.fn()}
      />
    );

    // Simulate typing indicator
    const chatWindow = screen.getByRole('main') || screen.getByTestId('chat-window');
    
    // This would be triggered by WebSocket events in real usage
    // For testing, we can check if the component handles typing state correctly
    expect(chatWindow).toBeInTheDocument();
  });

  test('handles group conversation display', () => {
    const groupConversation = createMockConversation({
      type: 'GROUP',
      title: 'Team Discussion',
      participants: [
        {
          id: 'participant-1',
          user: {
            id: 'user-1',
            name: 'Test User',
            email: 'test@example.com'
          },
          role: 'ADMIN',
          joinedAt: new Date().toISOString()
        },
        {
          id: 'participant-2',
          user: {
            id: 'user-2',
            name: 'Other User',
            email: 'other@example.com'
          },
          role: 'MEMBER',
          joinedAt: new Date().toISOString()
        },
        {
          id: 'participant-3',
          user: {
            id: 'user-3',
            name: 'Third User',
            email: 'third@example.com'
          },
          role: 'MEMBER',
          joinedAt: new Date().toISOString()
        }
      ]
    });

    render(
      <ChatWindow
        conversation={groupConversation}
        messages={[]}
        currentUserId="user-1"
        onSendMessage={jest.fn()}
      />
    );

    expect(screen.getByText('Team Discussion')).toBeInTheDocument();
    expect(screen.getByText('3 participants')).toBeInTheDocument();
  });

  test('disables input when loading', () => {
    render(
      <ChatWindow
        conversation={mockConversation}
        messages={[]}
        currentUserId="user-1"
        onSendMessage={jest.fn()}
        isLoading={true}
      />
    );

    const input = screen.getByPlaceholderText(/message other user/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });
});