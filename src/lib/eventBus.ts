type EventCallback = (payload: any) => void;

class EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback); // Returns an unsubscribe function
  }

  off(event: string, callback: EventCallback) {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, payload: any = {}) {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(payload);
      } catch (err) {
        console.error(`[EventBus] Error in listener for event ${event}:`, err);
      }
    });
  }
}

export const eventBus = new EventBus();
