import { espressoReadyProjection } from '../../state-view/SliceOrderReady/index.js';

// ============================================================================
// STATE CHANGE SLICE: slice: Confirm Order Ready
// ============================================================================

export const attemptConfirmOrderReady = (orderIdOverride) => {
  const orderId = orderIdOverride ?? `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    type: 'ConfirmOrderReadyAttempted',
    data: {
      orderId: orderId,
    }
  };
};


// STATE CHANGE: Automation slice for processor confirmation
export const processConfirmOrderReadySlice = (events) => {
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

