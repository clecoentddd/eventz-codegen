
import { toValidFunctionName, toKebabCase, toPascalCase } from '../helpers.js';

// Generate judge switch and stubs
export function generateJudgeRules(slices) {
  const stateChangeSlices = slices.filter(s => s.sliceType === 'STATE_CHANGE');
  const modules = [];
  const imports = [];

  console.log(`\n📋 Generating Judge Rules for ${stateChangeSlices.length} STATE_CHANGE slices...`);

  let routerCode = `// ============================================================================\n// JUDGE - Business Rules (Pure Function: Intent + History => Decision)\n// ============================================================================\n\nconst judge = (intentEvent, eventHistory) => {\n  switch (intentEvent.type) {\n`;

  let functionCode = '';
  const directoryCounts = new Map();

  stateChangeSlices.forEach(slice => {
    slice.commands.forEach(command => {
      const commandFnName = toValidFunctionName(command.title);
      const attemptedEventName = commandFnName + 'Attempted';
      console.log(`  ✓ Judge case for: ${command.title} (${attemptedEventName})`);
      routerCode += `    case '${attemptedEventName}':\n`;
      routerCode += `      return judge${commandFnName}(intentEvent, eventHistory);\n`;
    });
  });

  routerCode += `    default:\n      return { approved: true };\n  }\n};\n\n`;

  stateChangeSlices.forEach(slice => {
    const baseDirName = toPascalCase(slice.title) || 'StateChangeSlice';
    const occurrence = directoryCounts.get(baseDirName) || 0;
    directoryCounts.set(baseDirName, occurrence + 1);
    const sliceDirName = occurrence === 0 ? baseDirName : `${baseDirName}_${occurrence + 1}`;

    slice.commands.forEach(command => {
      const commandFnName = toValidFunctionName(command.title);
      const approvedEventName = command.dependencies.find(d => d.type === 'OUTBOUND' && d.elementType === 'EVENT')?.title || command.title.replace('create', 'Created');
      const approvedEventFnName = toValidFunctionName(approvedEventName);
      const rejectedEventName = approvedEventFnName + 'Rejected';

      const judgeContent = `const judge${commandFnName} = (intent, history) => {
  // TODO: Implement your business rules here
  // For now, auto-approve everything
  return {
    approved: true,
    approvalEvent: {
      type: '${approvedEventFnName}',
      data: {
        attemptId: intent.id,
${command.fields.map(field => `        ${field.name}: intent.data.${field.name},`).join('\n')}
      }
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
};\n`;

      if (command.title === 'Order Cappuccino') {
        console.log(`  ✨ Extracting judge function to file: judge${commandFnName}`);
        const modulePath = `slices/state-change/${sliceDirName}/judge.js`;
        const fileContent = `
// Import event creators for approval/rejection events
// e.g. import { CappuccinoOrdered } from './events.js';

${judgeContent}

export { judge${commandFnName} };
`;
        
        modules.push({ path: modulePath, content: fileContent.trim() });
        imports.push(`import { judge${commandFnName} } from './${modulePath}';`);
      } else {
        console.log(`  ✓ Judge function: judge${commandFnName} → ${approvedEventFnName}`);
        functionCode += judgeContent + '\n';
      }
    });
  });

  const code = routerCode + functionCode;

  return { code, modules, imports };
}
