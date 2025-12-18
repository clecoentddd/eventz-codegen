// ============================================================================
// STATE VIEW SLICE: slice: Espresso ready
// ============================================================================

// STATE VIEW: Ist of Espresso ready (TODO)
export const istOfEspressoReadyProjection = (events) => {
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

