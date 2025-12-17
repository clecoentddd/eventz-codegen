// ============================================================================
// STATE VIEW SLICE: slice: Espresso to prepare
// ============================================================================

// STATE VIEW: Espresso to prepare (TODO)
export const espressoToPrepareProjection = (events) => {
  return events.reduce((frostMilkPrepareds, event) => {
    switch (event.type) {
      case 'FrostMilkPrepared':
        frostMilkPrepareds[event.data.orderId] = {
          orderId: event.data.orderId,
          createdAt: event.timestamp
        };
        break;
      case 'EspressoOrdered':
        frostMilkPrepareds[event.data.orderId] = {
          orderId: event.data.orderId,
          createdAt: event.timestamp
        };
        break;
      case 'EspressoPrepared':
        delete frostMilkPrepareds[event.data.orderId];
        break;
      default:
        break;
    }
    return frostMilkPrepareds;
  }, {});
};

