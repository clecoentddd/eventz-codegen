# EventZ Code Generator Refactoring Plan

## Current State Analysis

### What GeneratedApp.jsx Currently Contains (❌ = Should Move)

1. ✅ **UI Code** - React components, event handlers, display logic
2. ❌ **Judge Functions** - `judgeOrderCappuccino()`, `judgeMarkFrostMilkPrepared()`, etc.
3. ❌ **runAutomation() Function** - Centralized polling-based automation
4. ✅ **Projection Calls** - Acceptable but could be cleaner with imports

### Problems with Current Architecture

1. **GeneratedApp.jsx is doing too much** - Mixed UI and business logic
2. **Judge logic is disconnected from slices** - Hard to find/test
3. **Polling-based automation** - Not true event-driven architecture
4. **Not leveraging RabbitMQ properly** - Using it as a queue, not pub/sub
5. **Large monolithic file** - Hard to maintain as app grows

---

## Target Architecture: Pure Event-Driven EventZ

### Principle: "Events Trigger Events"

Instead of polling with `runAutomation()`, use **RabbitMQ subscriptions** where:
- Events are published to RabbitMQ
- Processors subscribe to specific events
- When event arrives → processor creates command attempt
- Command goes through judge → produces new event
- **Cascade continues automatically**

### File Structure (Per Slice)

#### State Change Slices
```
slices/state-change/SliceOrderCappuccino/
├── index.js              # Exports all slice functions
├── command.js            # attemptOrderCappuccino()
├── judge.js              # judgeOrderCappuccino()
├── slice.js              # processOrderCappuccinoSlice() (if needed)
├── automation.js         # setupOrderCappuccinoAutomation() (event subscriptions)
└── events.js             # Event type constants
```

#### State View Slices
```
slices/state-view/SliceListOfCappuccino/
├── index.js              # Exports projection
├── projection.js         # listOfCappuccinoToPrepareProjection()
└── queries.js            # Optional: getByOrderId(), etc.
```

---

## Refactoring Steps

### Step 1: Move Judge Functions to Slices

**Current (GeneratedApp.jsx):**
```javascript
const judgeOrderCappuccino = (intent, history) => {
  // Business rules here
  return { approved: true, approvalEvent: {...} };
};
```

**New (slices/state-change/SliceOrderCappuccino/judge.js):**
```javascript
export const judgeOrderCappuccino = (intent, history) => {
  // TODO: Implement business rules
  // - Validate required fields
  // - Check for duplicates
  // - Verify dependencies exist
  
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
};
```

**Benefits:**
- Judge logic lives with the command it validates
- Easy to find and test in isolation
- Clear ownership per slice

---

### Step 2: Replace runAutomation() with Event Subscriptions

**Current Approach (Polling):**
```javascript
const runAutomation = (events, eventStore) => {
  // Check who needs action
  const needsAction = processSlice(events);
  
  // For each, create attempt
  needsAction.forEach(id => {
    const attempt = attemptCommand(id);
    mockRabbitMQ.publish('commands', 'attempts', attempt);
  });
};

// Called repeatedly
useEffect(() => {
  eventStore.subscribe((events) => {
    runAutomation(events, eventStore);
  });
}, []);
```

**New Approach (Event-Driven):**
```javascript
// slices/state-change/SliceFrostPrepareMilk/automation.js
export const setupFrostMilkAutomation = (mockRabbitMQ) => {
  // Subscribe: When CappuccinoOrdered → trigger MarkFrostMilkPrepared
  mockRabbitMQ.subscribe('events', 'CappuccinoOrdered', (event) => {
    const attemptEvent = attemptMarkFrostMilkPrepared(event.data.orderId);
    mockRabbitMQ.publish('commands', 'attempts', attemptEvent);
  });
};
```

**Setup at App Start:**
```javascript
// GeneratedApp.jsx or eventz-runtime.js
useEffect(() => {
  // Setup all automation subscriptions once
  setupFrostMilkAutomation(mockRabbitMQ);
  setupEspressoAutomation(mockRabbitMQ);
  setupConfirmOrderAutomation(mockRabbitMQ);
}, []);
```

**Benefits:**
- ✅ **True reactive** - automation happens when events arrive
- ✅ **Decoupled** - each automation only knows its trigger event
- ✅ **No polling** - RabbitMQ handles event distribution
- ✅ **Scalable** - Can distribute across processes/servers
- ✅ **Pure EventZ** - event-driven cascade

---

### Step 3: Clean Up GeneratedApp.jsx (UI Only)

**After Refactoring:**
```javascript
import React, { useState, useEffect } from 'react';
import { eventStore, mockRabbitMQ, startCommandDispatcher } from './eventz-runtime';

// Import projections
import { listOfCappuccinoProjection } from './slices/state-view/...';
import { espressoReadyProjection } from './slices/state-view/...';

// Import commands (user-initiated only)
import { attemptOrderCappuccino } from './slices/state-change/...';
import { attemptOrderEspresso } from './slices/state-change/...';

// Import automation setup
import { setupAllAutomations } from './automations';

export default function EventZApp() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // Setup automations once
    setupAllAutomations(mockRabbitMQ);
    
    // Subscribe to events for UI updates
    const unsubscribe = eventStore.subscribe(setEvents);
    return unsubscribe;
  }, []);

  // Build projections
  const cappuccinos = listOfCappuccinoProjection(events);
  const espressos = espressoReadyProjection(events);

  // UI handlers
  const handleOrderCappuccino = () => {
    const intent = attemptOrderCappuccino();
    mockRabbitMQ.publish('commands', 'attempts', intent);
  };

  return (
    <div>
      {/* Pure UI code - buttons, displays, etc. */}
      <button onClick={handleOrderCappuccino}>Order Cappuccino</button>
      {/* Display projections */}
    </div>
  );
}
```

**What's Left in GeneratedApp.jsx:**
- ✅ React components and UI
- ✅ Event handlers that publish commands
- ✅ Display projections
- ❌ NO judge logic
- ❌ NO automation logic
- ❌ NO business rules

---

## Generator Changes Required

### 1. Generate Judge Files Per Slice

**Generator Output:**
```
slices/state-change/SliceOrderCappuccino/judge.js
```

**Content:**
```javascript
export const judgeOrderCappuccino = (intent, history) => {
  // TODO: Implement your business rules here
  // Generated as empty template for developer to fill in
  
  return {
    approved: true,
    approvalEvent: {
      type: 'CappuccinoOrdered',
      data: {
        attemptId: intent.id,
        ...intent.data
      }
    }
  };
};
```

### 2. Generate Automation Files Per Slice

**From JSON Config:**
```json
"processor": {
  "title": "processor",
  "dependencies": [
    {
      "type": "INBOUND",
      "title": "Cappuccino Ordered",
      "elementType": "EVENT"
    },
    {
      "type": "OUTBOUND", 
      "title": "Mark Frost Milk Prepared",
      "elementType": "COMMAND"
    }
  ]
}
```

**Generator Creates:**
```javascript
// slices/state-change/SliceFrostPrepareMilk/automation.js
import { attemptMarkFrostMilkPrepared } from './command.js';

export const setupFrostMilkAutomation = (mockRabbitMQ) => {
  mockRabbitMQ.subscribe('events', 'CappuccinoOrdered', (event) => {
    const attemptEvent = attemptMarkFrostMilkPrepared(event.data.orderId);
    mockRabbitMQ.publish('commands', 'attempts', attemptEvent);
  });
};
```

### 3. Generate Automation Coordinator

**New File: automations/index.js**
```javascript
import { setupFrostMilkAutomation } from '../slices/state-change/SliceFrostPrepareMilk/automation.js';
import { setupEspressoAutomation } from '../slices/state-change/SliceMarkEspresso/automation.js';
import { setupConfirmOrderAutomation } from '../slices/state-change/SliceConfirmOrder/automation.js';

export const setupAllAutomations = (mockRabbitMQ) => {
  setupFrostMilkAutomation(mockRabbitMQ);
  setupEspressoAutomation(mockRabbitMQ);
  setupConfirmOrderAutomation(mockRabbitMQ);
};
```

### 4. Simplify GeneratedApp.jsx Template

**Remove:**
- All judge function definitions
- `runAutomation()` function
- Complex useEffect with automation polling

**Keep:**
- UI components
- Command handler functions (just publish to RabbitMQ)
- Projection displays
- Event stream display

---

## Migration Path

### Phase 1: Move Judges (Safe, No Behavior Change)
1. Generate judge.js files per slice
2. Import judges in GeneratedApp.jsx
3. Remove inline judge definitions
4. **Test:** Everything still works the same

### Phase 2: Convert to Event-Driven (Architectural Change)
1. Generate automation.js files per slice
2. Generate setupAllAutomations coordinator
3. Replace `runAutomation()` with `setupAllAutomations()`
4. **Test:** Automation now event-driven
5. Remove old slice functions (processMarkFrostMilkPreparedSlice, etc.) if no longer needed

### Phase 3: Clean Up GeneratedApp.jsx
1. Remove any remaining business logic
2. Simplify to pure UI
3. **Test:** Verify full event cascade works

---

## Benefits of Refactoring

### Developer Experience
- ✅ **Clear structure** - Know where to find judge/automation logic
- ✅ **Easy testing** - Test judges in isolation
- ✅ **Smaller files** - Easier to understand and maintain
- ✅ **Self-contained slices** - Each slice has everything it needs

### Architecture
- ✅ **True event-driven** - No polling, pure reactive
- ✅ **Decoupled** - Processors don't know about each other
- ✅ **Scalable** - Can distribute across multiple processes
- ✅ **Pure EventZ** - Events trigger events naturally

### Code Quality
- ✅ **Separation of concerns** - UI, business logic, automation all separated
- ✅ **Single responsibility** - Each file has one clear purpose
- ✅ **Testable** - Easy to unit test individual components
- ✅ **Maintainable** - Changes are localized to specific slices

---

## Open Questions

1. **Do we still need slice.js files?**
   - With event-driven, `processMarkFrostMilkPreparedSlice()` might not be needed
   - Only used if we need to query "who needs action" manually
   - Could keep for debugging/monitoring

2. **Where does the judge registry live?**
   - Currently in startCommandDispatcher
   - Could be in each slice's index.js
   - Or generated coordinator file

3. **How to handle idempotency?**
   - Event subscriptions might fire multiple times
   - Need to check "already processed" before creating attempt
   - Could be in automation.js or in judge

4. **Should projections be reactive too?**
   - Currently computed in useEffect
   - Could subscribe to specific events
   - Trade-off: simplicity vs performance

---

## Success Criteria

✅ **GeneratedApp.jsx is < 200 lines** (currently ~400)
✅ **All judge logic in slice files**
✅ **No runAutomation() polling loop**
✅ **Event-driven automation via RabbitMQ subscriptions**
✅ **Each slice is self-contained and testable**
✅ **Full cappuccino workflow still works end-to-end**

---

## Next Steps

1. ✅ Agree on refactoring approach (this document)
2. ⏳ Update generator to produce new structure
3. ⏳ Test with cappuccino example
4. ⏳ Update documentation
5. ⏳ Test with customer/account example
6. ⏳ Release new generator version

---

**Decision Point:** Should we proceed with this refactoring?
- **Pros:** Cleaner architecture, true event-driven, better scalability
- **Cons:** Breaking change, requires updating existing generated apps
- **Recommendation:** YES - this is the right architecture for EventZ