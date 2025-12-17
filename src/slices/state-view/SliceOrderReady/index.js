// ============================================================================
// STATE VIEW SLICE: slice: Order ready
// ============================================================================

// STATE VIEW: Espresso ready (TODO)
export const espressoReadyProjection = (events) => {
  return events.reduce((espressoPrepareds, event) => {
    switch (event.type) {
      case 'EspressoPrepared':
        espressoPrepareds[event.data.orderId] = {
          orderId: event.data.orderId,
          createdAt: event.timestamp
        };
        break;
      case 'DrinkReady':
        delete espressoPrepareds[event.data.orderId];
        break;
      default:
        break;
    }
    return espressoPrepareds;
  }, {});
};

