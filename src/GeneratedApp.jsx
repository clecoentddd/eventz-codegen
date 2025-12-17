import React, { useState, useEffect } from 'react';
import { eventStore, mockRabbitMQ, startCommandDispatcher } from './eventz-runtime';

import { listOfCappuccinoToPrepareProjection } from './slices/state-view/SliceListOfCappuccinoToPrepare/index.js';
import { espressoToPrepareProjection } from './slices/state-view/SliceEspressoToPrepare/index.js';
import { espressoReadyProjection } from './slices/state-view/SliceOrderReady/index.js';
import { orderReadyProjection } from './slices/state-view/SliceOrderReady_2/index.js';
import { attemptOrderEspresso } from './slices/state-change/SliceEspressoOrdered/index.js';
import { attemptOrderCappuccino } from './slices/state-change/SliceOrderCappuccino/index.js';

import { processMarkFrostMilkPreparedSlice, attemptMarkFrostMilkPrepared } from './slices/state-change/SliceFrostPrepareMilk/index.js';
import { processMarkEspressoPreparedSlice, attemptMarkEspressoPrepared } from './slices/state-change/SliceMarkEspressoPrepared/index.js';
import { processConfirmOrderReadySlice, attemptConfirmOrderReady } from './slices/state-change/SliceConfirmOrderReady/index.js';

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

const inFlightMarkFrostMilkPrepared = new Set();
const inFlightMarkEspressoPrepared = new Set();
const inFlightConfirmOrderReady = new Set();

// ============================================================================
// AUTOMATION - Process Slices and Apply Judge
// ============================================================================

const runAutomation = (events, eventStore) => {
  // User-initiated Order Espresso attempts are published via RabbitMQ handlers.
  // User-initiated Order Cappuccino attempts are published via RabbitMQ handlers.
  // Automation: processor
  const listOfCappuccinoToPrepareNeedingAction = processMarkFrostMilkPreparedSlice(events);
  const listOfCappuccinoToPreparePendingSet = new Set(listOfCappuccinoToPrepareNeedingAction);

  inFlightMarkFrostMilkPrepared.forEach(id => {
    if (!listOfCappuccinoToPreparePendingSet.has(id)) {
      inFlightMarkFrostMilkPrepared.delete(id);
    }
  });

  listOfCappuccinoToPrepareNeedingAction.forEach(orderId => {
    if (inFlightMarkFrostMilkPrepared.has(orderId)) {
      return;
    }

    inFlightMarkFrostMilkPrepared.add(orderId);
    const attemptEvent = attemptMarkFrostMilkPrepared(orderId);
    mockRabbitMQ.publish('commands', 'attempts', attemptEvent).catch((err) => {
      console.error('Failed to publish automation attempt', err);
      inFlightMarkFrostMilkPrepared.delete(orderId);
    });
  });
  
  // Automation: espresso maker processor
  const espressoToPrepareNeedingAction = processMarkEspressoPreparedSlice(events);
  const espressoToPreparePendingSet = new Set(espressoToPrepareNeedingAction);

  inFlightMarkEspressoPrepared.forEach(id => {
    if (!espressoToPreparePendingSet.has(id)) {
      inFlightMarkEspressoPrepared.delete(id);
    }
  });

  espressoToPrepareNeedingAction.forEach(orderId => {
    if (inFlightMarkEspressoPrepared.has(orderId)) {
      return;
    }

    inFlightMarkEspressoPrepared.add(orderId);
    const attemptEvent = attemptMarkEspressoPrepared(orderId);
    mockRabbitMQ.publish('commands', 'attempts', attemptEvent).catch((err) => {
      console.error('Failed to publish automation attempt', err);
      inFlightMarkEspressoPrepared.delete(orderId);
    });
  });
  
  // Automation: processor confirmation
  const espressoReadyNeedingAction = processConfirmOrderReadySlice(events);
  const espressoReadyPendingSet = new Set(espressoReadyNeedingAction);

  inFlightConfirmOrderReady.forEach(id => {
    if (!espressoReadyPendingSet.has(id)) {
      inFlightConfirmOrderReady.delete(id);
    }
  });

  espressoReadyNeedingAction.forEach(orderId => {
    if (inFlightConfirmOrderReady.has(orderId)) {
      return;
    }

    inFlightConfirmOrderReady.add(orderId);
    const attemptEvent = attemptConfirmOrderReady(orderId);
    mockRabbitMQ.publish('commands', 'attempts', attemptEvent).catch((err) => {
      console.error('Failed to publish automation attempt', err);
      inFlightConfirmOrderReady.delete(orderId);
    });
  });
  
};

startCommandDispatcher({ judge, eventStore, mockRabbitMQ });

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
