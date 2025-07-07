export const createMockSocket = () => {
  const eventHandlers: { [key: string]: Function[] } = {};
  const emittedEvents: { [key: string]: any[] } = {};

  return {
    // Event emission
    emit: jest.fn((event: string, data: any) => {
      if (!emittedEvents[event]) {
        emittedEvents[event] = [];
      }
      emittedEvents[event].push(data);
    }),

    // Event listening
    on: jest.fn((event: string, handler: Function) => {
      if (!eventHandlers[event]) {
        eventHandlers[event] = [];
      }
      eventHandlers[event].push(handler);
    }),

    // Event removal
    off: jest.fn((event: string, handler?: Function) => {
      if (handler) {
        const handlers = eventHandlers[event] || [];
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      } else {
        delete eventHandlers[event];
      }
    }),

    // Connection methods
    connect: jest.fn(),
    disconnect: jest.fn(),
    close: jest.fn(),

    // Connection state
    connected: true,
    disconnected: false,

    // Test helpers
    trigger: (event: string, data: any) => {
      const handlers = eventHandlers[event] || [];
      handlers.forEach(handler => handler(data));
    },

    // Access to emitted events and handlers for testing
    emitted: emittedEvents,
    handlers: eventHandlers,

    // Socket.io specific methods
    join: jest.fn(),
    leave: jest.fn(),
    to: jest.fn(() => ({
      emit: jest.fn()
    })),
    in: jest.fn(() => ({
      emit: jest.fn()
    }))
  };
};

// Mock Socket.io client
export const mockSocketClient = {
  io: jest.fn(() => createMockSocket())
};

// Mock for socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => createMockSocket())
}));