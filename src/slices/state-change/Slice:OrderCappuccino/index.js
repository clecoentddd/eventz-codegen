// ============================================================================
// STATE CHANGE SLICE: slice: Order Cappuccino
// ============================================================================

export const attemptOrderCappuccino = (orderidOverride) => {
  const orderid = orderidOverride ?? `ord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    type: 'OrderCappuccinoAttempted',
    data: {
      orderId: orderid,
    }
  };
};


// STATE CHANGE: Process Order Cappuccino attempts handled via RabbitMQ queue (OrderCappuccinoAttempted).
export const processOrderCappuccinoSlice = (events) => {
  return {
    attempted: events.filter(e => e.type === 'OrderCappuccinoAttempted'),
    approved: events.filter(e => e.type === 'CappuccinoOrdered'),
    rejected: events.filter(e => e.type === 'CappuccinoOrderedRejected')
  };
};

