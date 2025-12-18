// ============================================================================
// STATE VIEW SLICE: slice: Espresso to prepare
// ============================================================================

// STATE VIEW: Espresso to prepare (TODO)
export const espressoToPrepareProjection = (events) => {
  return events.reduce((espressoOrdereds, event) => {
    switch (event.type) {
      case 'EspressoOrdered':
        espressoOrdereds[event.data.orderId] = {
          orderId: event.data.orderId,
          createdAt: event.timestamp
        };
        break;
      case 'FrostMilkPrepared':
        espressoOrdereds[event.data.orderId] = {
          orderId: event.data.orderId,
          createdAt: event.timestamp
        };
        break;
      case 'EspressoPrepared':
        delete espressoOrdereds[event.data.orderId];
        break;
      default:
        break;
    }
    return espressoOrdereds;
  }, {});
};

