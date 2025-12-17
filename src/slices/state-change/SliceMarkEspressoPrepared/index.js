import { espressoToPrepareProjection } from '../../state-view/SliceEspressoToPrepare/index.js';

// ============================================================================
// STATE CHANGE SLICE: slice: Mark Espresso Prepared
// ============================================================================

export const attemptMarkEspressoPrepared = (orderIdOverride) => {
  const orderId = orderIdOverride ?? `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    type: 'MarkEspressoPreparedAttempted',
    data: {
      orderId: orderId,
    }
  };
};


// STATE CHANGE: Automation slice for espresso maker processor
export const processMarkEspressoPreparedSlice = (events) => {
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

