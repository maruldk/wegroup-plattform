
import { EventHandler, Event } from './types';

export class EventHandlerRegistry {
  private handlers: Map<string, EventHandler[]> = new Map();
  private globalHandlers: EventHandler[] = [];

  register(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    
    const handlers = this.handlers.get(eventType)!;
    handlers.push(handler);
    
    // Sort by priority (higher priority first)
    handlers.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  registerGlobal(handler: EventHandler): void {
    this.globalHandlers.push(handler);
    this.globalHandlers.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  async handle(event: Event): Promise<void> {
    const handlers = this.getHandlers(event.type);
    
    // Execute handlers in parallel with error isolation
    const promises = handlers.map(async (handler) => {
      try {
        if (handler.canHandle(event.type)) {
          await handler.handle(event);
        }
      } catch (error) {
        console.error(`Error in handler for event ${event.type}:`, error);
        // TODO: Implement dead letter queue or retry mechanism
      }
    });

    await Promise.allSettled(promises);
  }

  private getHandlers(eventType: string): EventHandler[] {
    const specificHandlers = this.handlers.get(eventType) || [];
    return [...this.globalHandlers, ...specificHandlers];
  }

  unregister(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  getRegisteredHandlers(): Map<string, EventHandler[]> {
    return new Map(this.handlers);
  }

  clear(): void {
    this.handlers.clear();
    this.globalHandlers = [];
  }
}

export default EventHandlerRegistry;
