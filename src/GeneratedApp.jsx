import React, { useState, useEffect } from 'react';
import { eventStore, mockRabbitMQ } from './eventz-runtime';

// Generated from EventZ configuration: eventZ Cappuccino
// Total slices: 9

// ============================================================================
// JUDGE - Business Rules (Pure Function: Intent + History => Decision)
// ============================================================================

const judge = (intentEvent, eventHistory) => {
  switch (intentEvent.type) {
    case 'OrderEspressoAttempted':
      return judgeOrderEspresso(intentEvent, eventHistory);
    case 'OrderCappuccinoAttempted':
      return judgeOrderCappuccino(intentEvent, eventHistory);
    case 'MarkFrostMilkPreparedAttempted':
      return judgeMarkFrostMilkPrepared(intentEvent, eventHistory);
    case 'MarkEspressoPreparedAttempted':
      return judgeMarkEspressoPrepared(intentEvent, eventHistory);
    case 'ConfirmOrderReadyAttempted':
      return judgeConfirmOrderReady(intentEvent, eventHistory);
    default:
      return { approved: true };
  }
};

const judgeOrderEspresso = (intent, history) => {
  // TODO: Implement your business rules here
  // Example rules you might want to add:
  // - Validate required fields
  // - Check for duplicates
  // - Verify dependencies exist
  // - Check business constraints
  
  // For now, auto-approve everything
  return {
    approved: true,
    approvalEvent: {
      type: 'EspressoOrdered',
      data: {
        attemptId: intent.id,
        orderId: intent.data.orderId,
      }
    }
  };
  
  // Example rejection:
  // return {
  //   approved: false,
  //   reason: 'Your rejection reason here',
  //   rejectionEvent: {
  //     type: 'EspressoOrderedRejected',
  //     data: {
  //       attemptId: intent.id,
  //       reason: 'Your rejection reason here',
  //       ...intent.data
  //     }
  //   }
  // };
};

const judgeOrderCappuccino = (intent, history) => {
  // TODO: Implement your business rules here
  // Example rules you might want to add:
  // - Validate required fields
  // - Check for duplicates
  // - Verify dependencies exist
  // - Check business constraints
  
  // For now, auto-approve everything
  return {
    approved: true,
    approvalEvent: {
      type: 'CappuccinoOrdered',
      data: {
        attemptId: intent.id,
        orderId: intent.data.orderId,
      }
    }
  };
  
  // Example rejection:
  // return {
  //   approved: false,
  //   reason: 'Your rejection reason here',
  //   rejectionEvent: {
  //     type: 'CappuccinoOrderedRejected',
  //     data: {
  //       attemptId: intent.id,
  //       reason: 'Your rejection reason here',
  //       ...intent.data
  //     }
  //   }
  // };
};

const judgeMarkFrostMilkPrepared = (intent, history) => {
  // TODO: Implement your business rules here
  // Example rules you might want to add:
  // - Validate required fields
  // - Check for duplicates
  // - Verify dependencies exist
  // - Check business constraints
  
  // For now, auto-approve everything
  return {
    approved: true,
    approvalEvent: {
      type: 'FrostMilkPrepared',
      data: {
        attemptId: intent.id,
        orderId: intent.data.orderId,
      }
    }
  };
  
  // Example rejection:
  // return {
  //   approved: false,
  //   reason: 'Your rejection reason here',
  //   rejectionEvent: {
  //     type: 'FrostMilkPreparedRejected',
  //     data: {
  //       attemptId: intent.id,
  //       reason: 'Your rejection reason here',
  //       ...intent.data
  //     }
  //   }
  // };
};

const judgeMarkEspressoPrepared = (intent, history) => {
  // TODO: Implement your business rules here
  // Example rules you might want to add:
  // - Validate required fields
  // - Check for duplicates
  // - Verify dependencies exist
  // - Check business constraints
  
  // For now, auto-approve everything
  return {
    approved: true,
    approvalEvent: {
      type: 'EspressoPrepared',
      data: {
        attemptId: intent.id,
        orderId: intent.data.orderId,
      }
    }
  };
  
  // Example rejection:
  // return {
  //   approved: false,
  //   reason: 'Your rejection reason here',
  //   rejectionEvent: {
  //     type: 'EspressoPreparedRejected',
  //     data: {
  //       attemptId: intent.id,
  //       reason: 'Your rejection reason here',
  //       ...intent.data
  //     }
  //   }
  // };
};

const judgeConfirmOrderReady = (intent, history) => {
  // TODO: Implement your business rules here
  // Example rules you might want to add:
  // - Validate required fields
  // - Check for duplicates
  // - Verify dependencies exist
  // - Check business constraints
  
  // For now, auto-approve everything
  return {
    approved: true,
    approvalEvent: {
      type: 'DrinkReady',
      data: {
        attemptId: intent.id,
        orderId: intent.data.orderId,
      }
    }
  };
  
  // Example rejection:
  // return {
  //   approved: false,
  //   reason: 'Your rejection reason here',
  //   rejectionEvent: {
  //     type: 'DrinkReadyRejected',
  //     data: {
  //       attemptId: intent.id,
  //       reason: 'Your rejection reason here',
  //       ...intent.data
  //     }
  //   }
  // };
};

// ============================================================================
// STATE VIEW SLICES - Projections (Read Models)
// ============================================================================

// STATE VIEW: List of cappuccino to prepare (TODO)
const listOfCappuccinoToPrepareProjection = (events) => {
  return events.reduce((cappuccinoOrdereds, event) => {
    switch (event.type) {
      case 'CappuccinoOrdered':
        cappuccinoOrdereds[event.data.orderId] = {
          orderId: event.data.orderId,
          createdAt: event.timestamp
        };
        break;
      case 'FrostMilkPrepared':
        delete cappuccinoOrdereds[event.data.orderId];
        break;
      default:
        break;
    }
    return cappuccinoOrdereds;
  }, {});
};

// STATE VIEW: Espresso to prepare (TODO)
const espressoToPrepareProjection = (events) => {
  return events.reduce((frostMilkPrepareds, event) => {
    switch (event.type) {
      case 'FrostMilkPrepared':
        frostMilkPrepareds[event.data.orderId] = {
          orderId: event.data.orderId,
          createdAt: event.timestamp
        };
        break;
      case 'EspressoOrdered':
        frostMilkPrepareds[event.data.orderId] = {
          orderId: event.data.orderId,
          createdAt: event.timestamp
        };
        break;
      case 'EspressoPrepared':
        delete frostMilkPrepareds[event.data.orderId];
        break;
      default:
        break;
    }
    return frostMilkPrepareds;
  }, {});
};

// STATE VIEW: Espresso ready (TODO)
const espressoReadyProjection = (events) => {
  return events.reduce((espressoPrepareds, event) => {
    switch (event.type) {
      case 'EspressoPrepared':
        espressoPrepareds[event.data.orderId] = {
          orderId: event.data.orderId,
          createdAt: event.timestamp
        };
        break;
      case 'DrinkReady':
        delete espressoPrepareds[event.data.orderId];
        break;
      default:
        break;
    }
    return espressoPrepareds;
  }, {});
};

// STATE VIEW: Order ready (TODO)
const orderReadyProjection = (events) => {
  return events.reduce((drinkReadys, event) => {
    switch (event.type) {
      case 'DrinkReady':
        drinkReadys[event.data.orderId] = {
          orderId: event.data.orderId,
          createdAt: event.timestamp
        };
        break;

      default:
        break;
    }
    return drinkReadys;
  }, {});
};

// ============================================================================
// STATE CHANGE SLICES - Process Intents
// ============================================================================

// STATE CHANGE: Process Order Espresso attempts handled via RabbitMQ queue (OrderEspressoAttempted).
// STATE CHANGE: Process Order Cappuccino attempts handled via RabbitMQ queue (OrderCappuccinoAttempted).
// STATE CHANGE: Automation slice for processor
const processMarkFrostMilkPreparedSlice = (events) => {
  const pendingEntities = listOfCappuccinoToPrepareProjection(events);
  const entityIds = Object.keys(pendingEntities);
  
  const processedIds = new Set(
    events
      .filter(e => e.type === 'FrostMilkPrepared')
      .map(e => e.data.orderId)
  );
  
  const attemptedIds = new Set(
    events
      .filter(e => e.type === 'MarkFrostMilkPreparedAttempted')
      .map(e => e.data.orderId)
  );
  
  return entityIds.filter(id => !processedIds.has(id) && !attemptedIds.has(id));
};

// STATE CHANGE: Automation slice for espresso maker processor
const processMarkEspressoPreparedSlice = (events) => {
  const pendingEntities = espressoToPrepareProjection(events);
  const entityIds = Object.keys(pendingEntities);
  
  const processedIds = new Set(
    events
      .filter(e => e.type === 'EspressoPrepared')
      .map(e => e.data.orderId)
  );
  
  const attemptedIds = new Set(
    events
      .filter(e => e.type === 'MarkEspressoPreparedAttempted')
      .map(e => e.data.orderId)
  );
  
  return entityIds.filter(id => !processedIds.has(id) && !attemptedIds.has(id));
};

// STATE CHANGE: Automation slice for processor confirmation
const processConfirmOrderReadySlice = (events) => {
  const pendingEntities = espressoReadyProjection(events);
  const entityIds = Object.keys(pendingEntities);
  
  const processedIds = new Set(
    events
      .filter(e => e.type === 'DrinkReady')
      .map(e => e.data.orderId)
  );
  
  const attemptedIds = new Set(
    events
      .filter(e => e.type === 'ConfirmOrderReadyAttempted')
      .map(e => e.data.orderId)
  );
  
  return entityIds.filter(id => !processedIds.has(id) && !attemptedIds.has(id));
};

// ============================================================================
// COMMAND HANDLERS - Create Intent Events
// ============================================================================

const attemptOrderEspresso = (orderIdOverride) => {
  const orderId = orderIdOverride ?? `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    type: 'OrderEspressoAttempted',
    data: {
      orderId: orderId,
    }
  };
};

const attemptOrderCappuccino = (orderIdOverride) => {
  const orderId = orderIdOverride ?? `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    type: 'OrderCappuccinoAttempted',
    data: {
      orderId: orderId,
    }
  };
};

const attemptMarkFrostMilkPrepared = (orderIdOverride) => {
  const orderId = orderIdOverride ?? `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    type: 'MarkFrostMilkPreparedAttempted',
    data: {
      orderId: orderId,
    }
  };
};

const attemptMarkEspressoPrepared = (orderIdOverride) => {
  const orderId = orderIdOverride ?? `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    type: 'MarkEspressoPreparedAttempted',
    data: {
      orderId: orderId,
    }
  };
};

const attemptConfirmOrderReady = (orderIdOverride) => {
  const orderId = orderIdOverride ?? `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    type: 'ConfirmOrderReadyAttempted',
    data: {
      orderId: orderId,
    }
  };
};

// ============================================================================
// AUTOMATION - Process Slices and Apply Judge
// ============================================================================

const runAutomation = (events, eventStore) => {
  // User-initiated Order Espresso attempts are published via RabbitMQ handlers.
  // User-initiated Order Cappuccino attempts are published via RabbitMQ handlers.
  // Automation: processor
  const listOfCappuccinoToPrepareNeedingAction = processMarkFrostMilkPreparedSlice(events);
  listOfCappuccinoToPrepareNeedingAction.forEach(orderId => {
    const attemptEvent = attemptMarkFrostMilkPrepared(orderId);
    mockRabbitMQ.publish('commands', 'attempts', attemptEvent).catch((err) => {
      console.error('Failed to publish automation attempt', err);
    });
  });
  
  // Automation: espresso maker processor
  const espressoToPrepareNeedingAction = processMarkEspressoPreparedSlice(events);
  espressoToPrepareNeedingAction.forEach(orderId => {
    const attemptEvent = attemptMarkEspressoPrepared(orderId);
    mockRabbitMQ.publish('commands', 'attempts', attemptEvent).catch((err) => {
      console.error('Failed to publish automation attempt', err);
    });
  });
  
  // Automation: processor confirmation
  const espressoReadyNeedingAction = processConfirmOrderReadySlice(events);
  espressoReadyNeedingAction.forEach(orderId => {
    const attemptEvent = attemptConfirmOrderReady(orderId);
    mockRabbitMQ.publish('commands', 'attempts', attemptEvent).catch((err) => {
      console.error('Failed to publish automation attempt', err);
    });
  });
  
};

const COMMAND_EXCHANGE = 'commands';
const COMMAND_ROUTING_KEY = 'attempts';
const AUDIT_EXCHANGE = 'audit';
const AUDIT_ROUTING_KEY = 'errors';

const startCommandDispatcher = (() => {
  let started = false;
  return () => {
    if (started) {
      return;
    }
    started = true;

    mockRabbitMQ.subscribe(COMMAND_EXCHANGE, COMMAND_ROUTING_KEY, async (intentEvent) => {
      const history = eventStore.getAllEvents();
      try {
        const decision = judge(intentEvent, history);
        const outcomeEvent = decision.approved ? decision.approvalEvent : decision.rejectionEvent;

        if (outcomeEvent) {
          eventStore.append(outcomeEvent);
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

        mockRabbitMQ.publish(AUDIT_EXCHANGE, AUDIT_ROUTING_KEY, auditEnvelope).catch((err) => {
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

        mockRabbitMQ.publish(AUDIT_EXCHANGE, AUDIT_ROUTING_KEY, auditEnvelope).catch((err) => {
          console.error('Failed to publish audit event', err);
        });
      }
    });
  };
})();

startCommandDispatcher();

// ============================================================================
// REACT UI
// ============================================================================

export default function EventZApp() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let isProcessing = false;
    let needsReplay = false;

    const processQueue = () => {
      if (isProcessing) {
        needsReplay = true;
        return;
      }

      isProcessing = true;
      setTimeout(() => {
        runAutomation(eventStore.getAllEvents(), eventStore);
        isProcessing = false;

        if (needsReplay) {
          needsReplay = false;
          processQueue();
        }
      }, 0);
    };

    const unsubscribe = eventStore.subscribe((allEvents) => {
      setEvents(allEvents);
      processQueue();
    });

    return unsubscribe;
  }, []);

  // Build projections
  const cappuccinoOrdereds = listOfCappuccinoToPrepareProjection(events);
  const frostMilkPrepareds = espressoToPrepareProjection(events);
  const espressoPrepareds = espressoReadyProjection(events);
  const drinkReadys = orderReadyProjection(events);

  const handleOrderEspresso = () => {
    setError('');
    setSuccess('');
    
    const intentEvent = attemptOrderEspresso();
    mockRabbitMQ.publish('commands', 'attempts', intentEvent)
      .catch((err) => {
        console.error('Failed to publish command', err);
        setError('Failed to queue Order Espresso');
      });
  };

  const handleOrderCappuccino = () => {
    setError('');
    setSuccess('');
    
    const intentEvent = attemptOrderCappuccino();
    mockRabbitMQ.publish('commands', 'attempts', intentEvent)
      .catch((err) => {
        console.error('Failed to publish command', err);
        setError('Failed to queue Order Cappuccino');
      });
  };

  const rejections = events.filter(e => 
    e.type.includes('Rejected')
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">
          eventZ Cappuccino
        </h1>
        <p className="text-purple-200 mb-8">Event Sourcing with Judge Pattern</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Order Espresso */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">Order Espresso</h2>
            <div className="space-y-4">
              <button
                onClick={handleOrderEspresso}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium transition-colors"
              >
                Order Espresso
              </button>
              {success && <div className="p-3 bg-green-500/20 border border-green-500/50 rounded text-green-200">{success}</div>}
              {error && <div className="p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200">{error}</div>}
            </div>
          </div>

          {/* Order Cappuccino */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">Order Cappuccino</h2>
            <div className="space-y-4">
              <button
                onClick={handleOrderCappuccino}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium transition-colors"
              >
                Order Cappuccino
              </button>
              {success && <div className="p-3 bg-green-500/20 border border-green-500/50 rounded text-green-200">{success}</div>}
              {error && <div className="p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200">{error}</div>}
            </div>
          </div>


          {/* Judge Rejections */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">Judge Rejections</h2>
            {rejections.length === 0 ? (
              <p className="text-green-200">All attempts approved!</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {rejections.slice().reverse().map(rejection => (
                  <div key={rejection.id} className="p-3 bg-red-500/20 border border-red-500/50 rounded">
                    <div className="text-red-200 text-sm">{rejection.data.reason}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* List of cappuccino to prepare */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-blue-500/50">
            <h2 className="text-xl font-bold text-white mb-3">
              List of cappuccino to prepare ({Object.keys(cappuccinoOrdereds).length})
            </h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {Object.values(cappuccinoOrdereds).map(item => (
                <div key={item.orderId} className="p-3 bg-blue-500/20 border border-blue-500/50 rounded">
                  <div className="text-white text-sm">orderId: {item.orderId}</div>
                </div>
              ))}
              {Object.keys(cappuccinoOrdereds).length === 0 && (
                <p className="text-purple-200">No items yet</p>
              )}
            </div>
          </div>

          {/* Espresso to prepare */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-blue-500/50">
            <h2 className="text-xl font-bold text-white mb-3">
              Espresso to prepare ({Object.keys(frostMilkPrepareds).length})
            </h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {Object.values(frostMilkPrepareds).map(item => (
                <div key={item.orderId} className="p-3 bg-blue-500/20 border border-blue-500/50 rounded">
                  <div className="text-white text-sm">orderId: {item.orderId}</div>
                </div>
              ))}
              {Object.keys(frostMilkPrepareds).length === 0 && (
                <p className="text-purple-200">No items yet</p>
              )}
            </div>
          </div>

          {/* Espresso ready */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-blue-500/50">
            <h2 className="text-xl font-bold text-white mb-3">
              Espresso ready ({Object.keys(espressoPrepareds).length})
            </h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {Object.values(espressoPrepareds).map(item => (
                <div key={item.orderId} className="p-3 bg-blue-500/20 border border-blue-500/50 rounded">
                  <div className="text-white text-sm">orderId: {item.orderId}</div>
                </div>
              ))}
              {Object.keys(espressoPrepareds).length === 0 && (
                <p className="text-purple-200">No items yet</p>
              )}
            </div>
          </div>

          {/* Order ready */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-blue-500/50">
            <h2 className="text-xl font-bold text-white mb-3">
              Order ready ({Object.keys(drinkReadys).length})
            </h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {Object.values(drinkReadys).map(item => (
                <div key={item.orderId} className="p-3 bg-blue-500/20 border border-blue-500/50 rounded">
                  <div className="text-white text-sm">orderId: {item.orderId}</div>
                </div>
              ))}
              {Object.keys(drinkReadys).length === 0 && (
                <p className="text-purple-200">No items yet</p>
              )}
            </div>
          </div>

        </div>

        {/* Event Stream */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">Event Stream ({events.length})</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.slice().reverse().map((event) => (
              <div key={event.id} className={
                  `p-3 rounded font-mono text-sm ${
                    event.type.includes('Attempted') ? 'bg-yellow-500/20 border border-yellow-500/50' :
                    event.type.includes('Rejected') ? 'bg-red-500/20 border border-red-500/50' :
                    'bg-green-500/20 border border-green-500/50'
                  }`
              }>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-white font-bold">{event.type}</span>
                  <span className="text-white/70 text-xs">{new Date(event.timestamp).toLocaleTimeString()}</span>
                </div>
                <pre className="text-white/90 text-xs overflow-x-auto">
                  {JSON.stringify(event.data, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
