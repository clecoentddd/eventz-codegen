// Event Store Implementation
export const eventStore = {
  events: [],
  subscribers: [],
  
  append(event) {
    const enrichedEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    this.events.push(enrichedEvent);
    this.notifySubscribers();
    return enrichedEvent;
  },
  
  getAllEvents() {
    return [...this.events];
  },
  
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== callback);
    };
  },
  
  notifySubscribers() {
    const snapshot = [...this.events];
    this.subscribers.forEach(cb => cb(snapshot));
  }
};

// Mock RabbitMQ Implementation
const makeQueueKey = (exchange, routingKey) => `${exchange}.${routingKey}`;

export const mockRabbitMQ = {
  queues: {},
  telemetry: {
    published: 0,
    consumed: 0,
    byQueue: new Map(),
    events: [],
    sequence: 0
  },

  ensureQueue(exchange, routingKey) {
    const key = makeQueueKey(exchange, routingKey);
    if (!this.queues[key]) {
      this.queues[key] = {
        exchange,
        routingKey,
        messages: [],
        subscribers: [],
        processing: false
      };
    }
    if (!this.telemetry.byQueue.has(key)) {
      this.telemetry.byQueue.set(key, { published: 0, consumed: 0 });
    }
    return { key, queue: this.queues[key] };
  },

  async publish(exchange, routingKey, event) {
    const { key, queue } = this.ensureQueue(exchange, routingKey);
    const envelope = {
      event: { ...event },
      publishedAt: Date.now()
    };
    queue.messages.push(envelope);
    this.telemetry.published += 1;
    const queueStats = this.telemetry.byQueue.get(key);
    queueStats.published += 1;
    this.trackEvent({ direction: 'published', queueKey: key, eventType: envelope.event.type });
    console.log(`📨 RabbitMQ publish ${key}`, envelope.event.type);
    await this.processQueue(queue, key);
    return envelope;
  },

  subscribe(exchange, routingKey, handler) {
    const { key, queue } = this.ensureQueue(exchange, routingKey);
    queue.subscribers.push(handler);
    console.log(`📬 RabbitMQ subscribe ${key}`);
    // Kick processing in case messages were waiting with no subscribers
    this.processQueue(queue, key).catch(err => {
      console.error('RabbitMQ subscriber processing error', err);
    });
    return () => {
      queue.subscribers = queue.subscribers.filter(sub => sub !== handler);
    };
  },

  async processQueue(queue, key) {
    if (queue.processing) {
      return;
    }
    queue.processing = true;
    while (queue.messages.length > 0) {
      const message = queue.messages.shift();
      // Simulate serialized delivery to consumers
      await new Promise(resolve => setTimeout(resolve, 500));
      for (const subscriber of queue.subscribers) {
        try {
          await Promise.resolve(subscriber(message.event));
          this.telemetry.consumed += 1;
          const queueStats = this.telemetry.byQueue.get(key);
          queueStats.consumed += 1;
          this.trackEvent({ direction: 'consumed', queueKey: key, eventType: message.event.type });
        } catch (err) {
          console.error('RabbitMQ handler error', err);
        }
      }
    }
    queue.processing = false;
  },

  trackEvent({ direction, queueKey, eventType }) {
    const entry = {
      id: ++this.telemetry.sequence,
      timestamp: Date.now(),
      direction,
      queueKey,
      eventType
    };
    this.telemetry.events.push(entry);
    if (this.telemetry.events.length > 200) {
      this.telemetry.events.shift();
    }
  },

  getTelemetrySnapshot() {
    const queueStats = {};
    this.telemetry.byQueue.forEach((stats, queueKey) => {
      queueStats[queueKey] = {
        published: stats.published,
        consumed: stats.consumed
      };
    });
    return {
      timestamp: Date.now(),
      published: this.telemetry.published,
      consumed: this.telemetry.consumed,
      queues: queueStats,
      events: [...this.telemetry.events],
      lastEventId: this.telemetry.sequence
    };
  }
};

const COMMAND_EXCHANGE = 'commands';
const COMMAND_ROUTING_KEY = 'attempts';
const AUDIT_EXCHANGE = 'audit';
const AUDIT_ROUTING_KEY = 'errors';

const runtimeState = globalThis.__eventzRuntime ?? (globalThis.__eventzRuntime = {});
const dispatcherState = runtimeState.commandDispatcher ?? (runtimeState.commandDispatcher = {
  started: false,
  unsubscribe: null
});

export const startCommandDispatcher = ({
  judge,
  eventStore: store = eventStore,
  mockRabbitMQ: bus = mockRabbitMQ,
  commandExchange = COMMAND_EXCHANGE,
  commandRoutingKey = COMMAND_ROUTING_KEY,
  auditExchange = AUDIT_EXCHANGE,
  auditRoutingKey = AUDIT_ROUTING_KEY
} = {}) => {
  if (typeof judge !== 'function') {
    throw new Error('startCommandDispatcher requires a judge function.');
  }

  if (dispatcherState.unsubscribe) {
    try {
      dispatcherState.unsubscribe();
    } catch (err) {
      console.warn('⚠️ Failed to unsubscribe prior dispatcher instance', err);
    }
    dispatcherState.unsubscribe = null;
    dispatcherState.started = false;
  }

  dispatcherState.started = true;

  dispatcherState.unsubscribe = bus.subscribe(commandExchange, commandRoutingKey, async (intentEvent) => {
    const history = store.getAllEvents();

    try {
      const decision = await Promise.resolve(judge(intentEvent, history));
      const outcomeEvent = decision?.approved ? decision.approvalEvent : decision?.rejectionEvent;

      if (outcomeEvent) {
        store.append(outcomeEvent);
        return;
      }

      const auditEnvelope = {
        type: 'CommandUnhandled',
        data: {
          attemptType: intentEvent.type,
          attemptId: intentEvent.id ?? null,
          reason: 'Judge returned no outcome event.'
        }
      };

      bus.publish(auditExchange, auditRoutingKey, auditEnvelope).catch((err) => {
        console.error('Failed to publish audit event', err);
      });
    } catch (error) {
      const auditEnvelope = {
        type: 'CommandFailed',
        data: {
          attemptType: intentEvent.type,
          attemptId: intentEvent.id ?? null,
          error: error?.message || 'Unknown error'
        }
      };

      bus.publish(auditExchange, auditRoutingKey, auditEnvelope).catch((errPublish) => {
        console.error('Failed to publish audit event', errPublish);
      });
    }
  });

  runtimeState.commandDispatcher = dispatcherState;

  return dispatcherState.unsubscribe;
};