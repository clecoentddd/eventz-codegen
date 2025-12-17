// ============================================================================
// STATE VIEW SLICE: slice: List of cappuccino to prepare
// ============================================================================

// STATE VIEW: List of cappuccino to prepare (TODO)
export const listOfCappuccinoToPrepareProjection = (events) => {
  return events.reduce((cappuccinoOrdereds, event) => {
    switch (event.type) {
      case 'CappuccinoOrdered':
        cappuccinoOrdereds[event.data.orderId] = {
          orderId: event.data.orderId,
          createdAt: event.timestamp
        };
        break;
      case 'FrostMilkPrepared':
        delete cappuccinoOrdereds[event.data.orderId];
        break;
      default:
        break;
    }
    return cappuccinoOrdereds;
  }, {});
};

