// ============================================================================
// STATE CHANGE SLICE: slice: Espresso Ordered
// ============================================================================

export const attemptOrderEspresso = (orderIdOverride) => {
  const orderId = orderIdOverride ?? `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    type: 'OrderEspressoAttempted',
    data: {
      orderId: orderId,
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

