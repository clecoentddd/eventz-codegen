// ============================================================================
// STATE VIEW SLICE: slice: List of cappuccino to prepare
// ============================================================================

// STATE VIEW: List of cappuccino to prepare (TODO)
export const listOfCappuccinoToPrepareProjection = (events) => {
  return events.reduce((cappuccinos, event) => {
    switch (event.type) {
      case 'CappuccinoOrdered':
        cappuccinos[event.data.orderId] = {
          orderId: event.data.orderId,
          createdAt: event.timestamp
        };
        break;
      case 'FrostMilkPrepared':
        delete cappuccinos[event.data.orderId];
        break;
      default:
        break;
    }
    return cappuccinos;
  }, {});
};

