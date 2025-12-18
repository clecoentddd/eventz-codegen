import { espressoToPrepareProjection } from '../../state-view/Slice:EspressoToPrepare/index.js';

// ============================================================================
// STATE CHANGE SLICE: slice: Mark Espresso Prepared
// ============================================================================

export const attemptMarkEspressoPrepared = (orderidOverride) => {
  const orderid = orderidOverride ?? `ord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    type: 'MarkEspressoPreparedAttempted',
    data: {
      orderId: orderid,
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

