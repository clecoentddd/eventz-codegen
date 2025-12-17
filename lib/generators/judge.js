import { toValidFunctionName } from '../helpers.js';

// Generate judge switch and stubs
export function generateJudgeRules(slices) {
  const stateChangeSlices = slices.filter(s => s.sliceType === 'STATE_CHANGE');
  
  console.log(`\n📋 Generating Judge Rules for ${stateChangeSlices.length} STATE_CHANGE slices...`);
  
  let code = `// ============================================================================
// JUDGE - Business Rules (Pure Function: Intent + History => Decision)
// ============================================================================

const judge = (intentEvent, eventHistory) => {
  switch (intentEvent.type) {
`;

  stateChangeSlices.forEach(slice => {
    slice.commands.forEach(command => {
      const attemptedEventName = toValidFunctionName(command.title) + 'Attempted';
      console.log(`  ✓ Judge case for: ${command.title} (${attemptedEventName})`);
      code += `    case '${attemptedEventName}':\n`;
      code += `      return judge${toValidFunctionName(command.title)}(intentEvent, eventHistory);\n`;
    });
  });

  code += `    default:
      return { approved: true };
  }
};

`;

  stateChangeSlices.forEach(slice => {
    slice.commands.forEach(command => {
      const commandFnName = toValidFunctionName(command.title);
      const approvedEventName = command.dependencies.find(d => d.type === 'OUTBOUND' && d.elementType === 'EVENT')?.title || command.title.replace('create', 'Created');
      const approvedEventFnName = toValidFunctionName(approvedEventName);
      const rejectedEventName = approvedEventFnName + 'Rejected';
      
      console.log(`  ✓ Judge function: judge${commandFnName} → ${approvedEventFnName}`);
      
      code += `const judge${commandFnName} = (intent, history) => {
  // TODO: Implement your business rules here
  // Example rules you might want to add:
  // - Validate required fields
  // - Check for duplicates
  // - Verify dependencies exist
  // - Check business constraints
  
  // For now, auto-approve everything
  return {
    approved: true,
    approvalEvent: {
      type: '${approvedEventFnName}',
      data: {
        attemptId: intent.id,
`;

      command.fields.forEach(field => {
        code += `        ${field.name}: intent.data.${field.name},\n`;
      });

      code += `      }
    }
  };
  
  // Example rejection:
  // return {
  //   approved: false,
  //   reason: 'Your rejection reason here',
  //   rejectionEvent: {
  //     type: '${rejectedEventName}',
  //     data: {
  //       attemptId: intent.id,
  //       reason: 'Your rejection reason here',
  //       ...intent.data
  //     }
  //   }
  // };
};

`;
    });
  });

  return code;
}
