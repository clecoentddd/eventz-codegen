// ============================================================================
// STATE VIEW SLICE: slice: order ready
// ============================================================================

// STATE VIEW: Order ready (TODO)
export const orderReadyProjection = (events) => {
  return events.reduce((drinkReadys, event) => {
    switch (event.type) {
      case 'DrinkReady':
        drinkReadys[event.data.orderId] = {
          orderId: event.data.orderId,
          createdAt: event.timestamp
        };
        break;

      default:
        break;
    }
    return drinkReadys;
  }, {});
};

