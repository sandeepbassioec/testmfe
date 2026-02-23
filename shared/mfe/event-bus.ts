/**
 * Event Bus Implementation
 * Enables cross-MFE communication without direct dependencies
 */

import type { EventPayload, EventSubscription } from './types';

type EventListener = (payload: EventPayload) => void;
type EventPattern = string | RegExp;

class EventBus {
  private listeners: Map<string, Set<EventListener>> = new Map();
  private patternListeners: Map<RegExp, Set<EventListener>> = new Map();
  private history: EventPayload[] = [];
  private maxHistorySize = 100;
  private source: string;

  constructor(source: string = 'unknown') {
    this.source = source;
  }

  /**
   * Subscribe to specific event type
   */
  on(eventType: string, listener: EventListener): EventSubscription {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);

    return {
      unsubscribe: () => {
        const listeners = this.listeners.get(eventType);
        if (listeners) {
          listeners.delete(listener);
          if (listeners.size === 0) {
            this.listeners.delete(eventType);
          }
        }
      },
    };
  }

  /**
   * Subscribe to events matching a pattern
   */
  onPattern(pattern: RegExp, listener: EventListener): EventSubscription {
    if (!this.patternListeners.has(pattern)) {
      this.patternListeners.set(pattern, new Set());
    }
    this.patternListeners.get(pattern)!.add(listener);

    return {
      unsubscribe: () => {
        const listeners = this.patternListeners.get(pattern);
        if (listeners) {
          listeners.delete(listener);
          if (listeners.size === 0) {
            this.patternListeners.delete(pattern);
          }
        }
      },
    };
  }

  /**
   * Subscribe to event once
   */
  once(eventType: string, listener: EventListener): EventSubscription {
    const subscription = this.on(eventType, (payload) => {
      listener(payload);
      subscription.unsubscribe();
    });
    return subscription;
  }

  /**
   * Emit event to all listeners
   */
  emit(
    eventType: string,
    data?: any,
    sourceId?: string
  ): void {
    const payload: EventPayload = {
      type: eventType,
      source: sourceId || this.source,
      timestamp: Date.now(),
      data,
    };

    // Store in history
    this.history.push(payload);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // Notify direct listeners
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(payload);
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error);
        }
      });
    }

    // Notify pattern listeners
    this.patternListeners.forEach((patternListeners, pattern) => {
      if (pattern.test(eventType)) {
        patternListeners.forEach((listener) => {
          try {
            listener(payload);
          } catch (error) {
            console.error(`Error in pattern listener for ${pattern}:`, error);
          }
        });
      }
    });
  }

  /**
   * Get event history
   */
  getHistory(eventType?: string, limit?: number): EventPayload[] {
    let filtered = this.history;
    
    if (eventType) {
      filtered = filtered.filter(e => e.type === eventType);
    }
    
    if (limit) {
      filtered = filtered.slice(-limit);
    }
    
    return filtered;
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Get listener count
   */
  getListenerCount(eventType: string): number {
    return (this.listeners.get(eventType)?.size || 0) +
      Array.from(this.patternListeners.values()).reduce(
        (sum, listeners) => sum + listeners.size,
        0
      );
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(eventType?: string): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
      this.patternListeners.clear();
    }
  }
}

// Global event bus instance
let globalEventBus: EventBus | null = null;

export const createEventBus = (source?: string): EventBus => {
  return new EventBus(source);
};

export const getGlobalEventBus = (): EventBus => {
  if (!globalEventBus) {
    globalEventBus = new EventBus('global');
  }
  return globalEventBus;
};

export const resetEventBus = (): void => {
  if (globalEventBus) {
    globalEventBus.removeAllListeners();
  }
  globalEventBus = null;
};

export { EventBus };
