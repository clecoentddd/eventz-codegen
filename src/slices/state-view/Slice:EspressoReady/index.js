// ============================================================================
// STATE VIEW SLICE: slice: Espresso ready
// ============================================================================

// STATE VIEW: Ist of Espresso ready (TODO)
export const istOfEspressoReadyProjection = (events) => {
  return events.reduce((espressos, event) => {
    switch (event.type) {
      case 'EspressoPrepared':
        espressos[event.data.orderId] = {
          orderId: event.data.orderId,
          createdAt: event.timestamp
        };
        break;
      case 'DrinkReady':
        delete espressos[event.data.orderId];
        break;
      default:
        break;
    }
    return espressos;
  }, {});
};

