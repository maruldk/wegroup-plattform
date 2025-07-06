
export interface Event {
  id: string;
  type: string;
  aggregateId?: string;
  data: any;
  metadata: {
    userId?: string;
    tenantId?: string;
    correlationId?: string;
    causationId?: string;
    version: number;
    source: string;
    [key: string]: any; // Allow additional metadata properties
  };
  timestamp: Date;
  isReplay?: boolean;
}

export interface EventHandler {
  handle(event: Event): Promise<void>;
  canHandle(eventType: string): boolean;
  priority?: number;
}

export interface EventMiddleware {
  process(event: Event): Promise<Event>;
}

export interface EventFilter {
  shouldProcess(event: Event): boolean;
}

export interface EventProjection {
  name: string;
  apply(event: Event): Promise<void>;
  rebuild(): Promise<void>;
}

export interface Snapshot {
  aggregateId: string;
  version: number;
  data: any;
  timestamp: Date;
}

// Business Event Types
export interface FinancialEvent extends Event {
  type: 'financial.invoice.created' | 'financial.payment.processed' | 'financial.budget.exceeded';
  data: {
    amount: number;
    currency: string;
    accountId: string;
    metadata: Record<string, any>;
  };
}

export interface ProjectEvent extends Event {
  type: 'project.created' | 'project.milestone.completed' | 'project.resource.allocated';
  data: {
    projectId: string;
    userId: string;
    metadata: Record<string, any>;
  };
}

export interface CustomerEvent extends Event {
  type: 'customer.registered' | 'customer.interaction' | 'customer.churn.predicted';
  data: {
    customerId: string;
    interactionType?: string;
    churnProbability?: number;
    metadata: Record<string, any>;
  };
}

export interface SystemEvent extends Event {
  type: 'system.anomaly.detected' | 'system.performance.degraded' | 'system.backup.completed';
  data: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    component: string;
    metrics: Record<string, number>;
  };
}

export interface ModelEvent extends Event {
  type: 'model.prediction.completed' | 'model.retrained' | 'model.drift.detected';
  data: {
    modelId: string;
    modelVersion: string;
    accuracy?: number;
    driftScore?: number;
    predictionId?: string;
  };
}

export interface AutomationEvent extends Event {
  type: 'workflow.started' | 'workflow.completed' | 'workflow.failed';
  data: {
    workflowId: string;
    workflowType: string;
    status: 'running' | 'completed' | 'failed';
    result?: any;
    error?: string;
  };
}

export interface GroupEvent extends Event {
  type: 'group.created' | 'group.updated' | 'group.deleted' | 'group.archived' | 
        'group.member.joined' | 'group.member.left' | 'group.member.invited' | 
        'group.member.removed' | 'group.member.role.changed' | 
        'group.role.created' | 'group.role.updated' | 'group.role.deleted' |
        'group.settings.changed' | 'group.visibility.changed';
  data: {
    groupId: string;
    groupName: string;
    memberId?: string;
    memberEmail?: string;
    roleId?: string;
    roleName?: string;
    previousRole?: string;
    newRole?: string;
    settings?: Record<string, any>;
    changes?: Record<string, any>;
    metadata: Record<string, any>;
  };
}

// Event Processing Types
export interface RouteDecision {
  targetHandlers: string[];
  priority: number;
  confidence: number;
}

export interface Correlation {
  id: string;
  events: Event[];
  correlationType: 'temporal' | 'causal' | 'pattern' | 'anomaly';
  confidence: number;
  timestamp: Date;
}

export interface EventProcessingRule {
  id: string;
  name: string;
  pattern: string;
  action: string;
  enabled: boolean;
}
