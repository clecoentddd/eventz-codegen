import { listOfCappuccinoToPrepareProjection } from '../../state-view/SliceListOfCappuccinoToPrepare/index.js';

// ============================================================================
// STATE CHANGE SLICE: slice: Frost Prepare Milk
// ============================================================================

export const attemptMarkFrostMilkPrepared = (orderIdOverride) => {
  const orderId = orderIdOverride ?? `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    type: 'MarkFrostMilkPreparedAttempted',
    data: {
      orderId: orderId,
    }
  };
};


// STATE CHANGE: Automation slice for processor
export const processMarkFrostMilkPreparedSlice = (events) => {
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

