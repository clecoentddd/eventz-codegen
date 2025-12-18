// ============================================================================
// STATE VIEW SLICE: slice: Espresso to prepare
// ============================================================================

// STATE VIEW: Espresso to prepare (TODO)
export const espressoToPrepareProjection = (events) => {
  return events.reduce((espressos, event) => {
    switch (event.type) {
      case 'EspressoOrdered':
        espressos[event.data.orderId] = {
          orderId: event.data.orderId,
          createdAt: event.timestamp
        };
        break;
      case 'FrostMilkPrepared':
        espressos[event.data.orderId] = {
          orderId: event.data.orderId,
          createdAt: event.timestamp
        };
        break;
      case 'EspressoPrepared':
        delete espressos[event.data.orderId];
        break;
      default:
        break;
    }
    return espressos;
  }, {});
};

