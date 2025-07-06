
import { Event, Snapshot, EventProjection } from './types';

export class EventStore {
  private events: Map<string, Event[]> = new Map();
  private snapshots: Map<string, Snapshot> = new Map();
  private projections: Map<string, EventProjection> = new Map();

  async append(event: Event): Promise<void> {
    const aggregateId = event.aggregateId || 'global';
    
    if (!this.events.has(aggregateId)) {
      this.events.set(aggregateId, []);
    }
    
    const events = this.events.get(aggregateId)!;
    
    // Ensure event ordering
    const expectedVersion = events.length;
    if (event.metadata.version !== expectedVersion) {
      throw new Error(`Concurrency conflict. Expected version ${expectedVersion}, got ${event.metadata.version}`);
    }
    
    events.push(event);
    
    // Update projections
    await this.updateProjections(event);
  }

  async getEvents(aggregateId: string, fromVersion = 0): Promise<Event[]> {
    const events = this.events.get(aggregateId) || [];
    return events.slice(fromVersion);
  }

  async getSnapshot(aggregateId: string): Promise<Snapshot | null> {
    return this.snapshots.get(aggregateId) || null;
  }

  async createSnapshot(aggregateId: string, data: any): Promise<void> {
    const events = this.events.get(aggregateId) || [];
    const snapshot: Snapshot = {
      aggregateId,
      version: events.length,
      data,
      timestamp: new Date()
    };
    
    this.snapshots.set(aggregateId, snapshot);
  }

  // Projection Management
  registerProjection(projection: EventProjection): void {
    this.projections.set(projection.name, projection);
  }

  private async updateProjections(event: Event): Promise<void> {
    for (const projection of this.projections.values()) {
      try {
        await projection.apply(event);
      } catch (error) {
        console.error(`Error updating projection ${projection.name}:`, error);
      }
    }
  }

  async rebuildProjection(projectionName: string): Promise<void> {
    const projection = this.projections.get(projectionName);
    if (!projection) {
      throw new Error(`Projection ${projectionName} not found`);
    }

    await projection.rebuild();
    
    // Replay all events
    for (const [aggregateId, events] of this.events.entries()) {
      for (const event of events) {
        await projection.apply(event);
      }
    }
  }

  // Event Stream Operations
  async getEventStream(aggregateId: string): Promise<AsyncIterable<Event>> {
    const events = this.events.get(aggregateId) || [];
    
    return {
      async *[Symbol.asyncIterator]() {
        for (const event of events) {
          yield event;
        }
      }
    };
  }

  // Aggregate Reconstruction
  async reconstructAggregate<T>(
    aggregateId: string, 
    aggregateClass: new () => T,
    applyEvent: (aggregate: T, event: Event) => void
  ): Promise<T> {
    const snapshot = await this.getSnapshot(aggregateId);
    let aggregate: T;
    let fromVersion = 0;

    if (snapshot) {
      aggregate = Object.assign(new aggregateClass() as any, snapshot.data) as T;
      fromVersion = snapshot.version;
    } else {
      aggregate = new aggregateClass();
    }

    const events = await this.getEvents(aggregateId, fromVersion);
    for (const event of events) {
      applyEvent(aggregate, event);
    }

    return aggregate;
  }

  // Cleanup and Maintenance
  async archiveEvents(aggregateId: string, beforeVersion: number): Promise<void> {
    const events = this.events.get(aggregateId);
    if (!events) return;

    const eventsToKeep = events.slice(beforeVersion);
    this.events.set(aggregateId, eventsToKeep);
  }

  getStatistics(): {
    totalEvents: number;
    totalAggregates: number;
    totalSnapshots: number;
    totalProjections: number;
  } {
    const totalEvents = Array.from(this.events.values())
      .reduce((sum, events) => sum + events.length, 0);

    return {
      totalEvents,
      totalAggregates: this.events.size,
      totalSnapshots: this.snapshots.size,
      totalProjections: this.projections.size
    };
  }
}

export default EventStore;
