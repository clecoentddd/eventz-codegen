// ============================================================================
// STATE CHANGE SLICE: slice: Espresso Ordered
// ============================================================================

export const attemptOrderEspresso = (orderidOverride) => {
  const orderid = orderidOverride ?? `ord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    type: 'OrderEspressoAttempted',
    data: {
      orderId: orderid,
    }
  };
};


// STATE CHANGE: Process Order Espresso attempts handled via RabbitMQ queue (OrderEspressoAttempted).
export const processOrderEspressoSlice = (events) => {
  return {
    attempted: events.filter(e => e.type === 'OrderEspressoAttempted'),
    approved: events.filter(e => e.type === 'EspressoOrdered'),
    rejected: events.filter(e => e.type === 'EspressoOrderedRejected')
  };
};

