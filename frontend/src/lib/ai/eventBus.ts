import { WorkflowEvent, EventType } from './types';

type EventHandler = (event: WorkflowEvent) => void | Promise<void>;

class EventBus {
  private listeners = new Map<EventType, Set<EventHandler>>();
  private globalListeners = new Set<EventHandler>();
  private history: WorkflowEvent[] = [];
  private maxHistory = 500;

  on(type: EventType, handler: EventHandler): () => void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(handler);
    return () => this.listeners.get(type)?.delete(handler);
  }

  onAny(handler: EventHandler): () => void {
    this.globalListeners.add(handler);
    return () => this.globalListeners.delete(handler);
  }

  async emit(event: WorkflowEvent): Promise<void> {
    this.history.push(event);
    if (this.history.length > this.maxHistory) this.history.shift();

    const handlers = this.listeners.get(event.type);
    const promises: Promise<void>[] = [];

    if (handlers) handlers.forEach((h) => promises.push(Promise.resolve(h(event))));
    this.globalListeners.forEach((h) => promises.push(Promise.resolve(h(event))));

    await Promise.allSettled(promises);
  }

  getHistory(type?: EventType): WorkflowEvent[] {
    return type ? this.history.filter((e) => e.type === type) : [...this.history];
  }

  clear(): void {
    this.history = [];
    this.listeners.clear();
    this.globalListeners.clear();
  }
}

export const eventBus = new EventBus();

let eventCounter = 0;
export function createEvent(
  type: EventType,
  projectId: string,
  data: Record<string, unknown> = {},
  actor: WorkflowEvent['actor'] = 'user',
): WorkflowEvent {
  return {
    type,
    projectId,
    timestamp: new Date().toISOString(),
    actor,
    data,
    id: `evt_${Date.now()}_${++eventCounter}`,
  };
}
