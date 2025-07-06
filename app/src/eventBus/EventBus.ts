
import { EventEmitter } from 'events';
import { Event, EventHandler, EventFilter, EventMiddleware } from './types';

export class InMemoryEventBus extends EventEmitter {
  private eventStore: Map<string, Event[]> = new Map();
  private subscribers: Map<string, EventHandler[]> = new Map();
  private eventHistory: Event[] = [];
  private maxHistorySize = 10000;
  private middleware: EventMiddleware[] = [];
  private filters: EventFilter[] = [];

  constructor() {
    super();
    this.setMaxListeners(0); // Unlimited listeners
  }

  // Event Publishing
  async publish(event: Event): Promise<void> {
    try {
      // Apply middleware
      let processedEvent = event;
      for (const middleware of this.middleware) {
        processedEvent = await middleware.process(processedEvent);
      }

      // Apply filters
      for (const filter of this.filters) {
        if (!filter.shouldProcess(processedEvent)) {
          return;
        }
      }

      // Store event
      this.storeEvent(processedEvent);

      // Emit to subscribers
      this.emit(processedEvent.type, processedEvent);
      this.emit('*', processedEvent); // Wildcard subscription

      // Update metrics
      this.updateMetrics(processedEvent);

    } catch (error) {
      console.error('Error publishing event:', error);
      throw error;
    }
  }

  // Event Subscription
  subscribe(eventType: string, handler: EventHandler): void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    this.subscribers.get(eventType)!.push(handler);
    this.on(eventType, handler.handle.bind(handler));
  }

  // Event Store Management
  private storeEvent(event: Event): void {
    const aggregateId = event.aggregateId || 'global';
    
    if (!this.eventStore.has(aggregateId)) {
      this.eventStore.set(aggregateId, []);
    }
    
    this.eventStore.get(aggregateId)!.push(event);
    
    // Add to history with circular buffer
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  // Event Retrieval
  getEvents(aggregateId: string, fromTimestamp?: Date): Event[] {
    const events = this.eventStore.get(aggregateId) || [];
    
    if (fromTimestamp) {
      return events.filter(event => event.timestamp >= fromTimestamp);
    }
    
    return [...events];
  }

  getEventsByType(eventType: string, limit = 100): Event[] {
    return this.eventHistory
      .filter(event => event.type === eventType)
      .slice(-limit);
  }

  // Middleware Management
  addMiddleware(middleware: EventMiddleware): void {
    this.middleware.push(middleware);
  }

  addFilter(filter: EventFilter): void {
    this.filters.push(filter);
  }

  // Metrics
  private updateMetrics(event: Event): void {
    // TODO: Implement metrics collection
    // This would integrate with Prometheus or similar
  }

  // Health Check
  getHealthStatus(): { status: string; metrics: any } {
    return {
      status: 'healthy',
      metrics: {
        totalEvents: this.eventHistory.length,
        subscriberCount: Array.from(this.subscribers.values()).reduce((sum, handlers) => sum + handlers.length, 0),
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      }
    };
  }

  // Event Replay
  async replayEvents(aggregateId: string, fromTimestamp: Date, toTimestamp?: Date): Promise<void> {
    const events = this.getEvents(aggregateId, fromTimestamp);
    const filteredEvents = toTimestamp 
      ? events.filter(event => event.timestamp <= toTimestamp)
      : events;

    for (const event of filteredEvents) {
      await this.publish({ ...event, isReplay: true });
    }
  }

  // Cleanup
  clear(): void {
    this.eventStore.clear();
    this.eventHistory = [];
    this.removeAllListeners();
  }
}

export default InMemoryEventBus;
