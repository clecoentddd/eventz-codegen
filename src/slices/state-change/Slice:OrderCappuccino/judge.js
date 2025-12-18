// Import event creators for approval/rejection events
// e.g. import { CappuccinoOrdered } from './events.js';

const judgeOrderCappuccino = (intent, history) => {
  // TODO: Implement your business rules here
  // For now, auto-approve everything
  return {
    approved: true,
    approvalEvent: {
      type: 'CappuccinoOrdered',
      data: {
        attemptId: intent.id,
        orderId: intent.data.orderId,
      }
    }
  };
  
  // Example rejection:
  // return {
  //   approved: false,
  //   reason: 'Your rejection reason here',
  //   rejectionEvent: {
  //     type: 'CappuccinoOrderedRejected',
  //     data: {
  //       attemptId: intent.id,
  //       reason: 'Your rejection reason here',
  //       ...intent.data
  //     }
  //   }
  // };
};


export { judgeOrderCappuccino };