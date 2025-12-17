import {
  toValidFunctionName,
  toValidVariableName
} from '../helpers.js';
import {
  renderAutomationUserBlock,
  renderAutomationProcessorBlock
} from '../templates.js';

// Compose automation runtime for commands and processors
export function generateAutomation(slices, options = {}) {
  const { automationImports = [] } = options;
  const stateChangeSlices = slices.filter(s => s.sliceType === 'STATE_CHANGE');
  const automationSlices = slices.filter(s => s.processors && s.processors.length > 0);
  const automationLocks = [];
  
  console.log(`\n🤖 Generating Automation...`);

  const importMap = new Map();
  automationImports.forEach(({ path, processName, attemptName }) => {
    const existing = importMap.get(path) || new Set();
    existing.add(processName);
    existing.add(attemptName);
    importMap.set(path, existing);
  });

  const importLines = Array.from(importMap.entries())
    .map(([path, names]) => `import { ${Array.from(names).join(', ')} } from '${path}';`)
    .join('\n');
  
  const header = `// ============================================================================
// AUTOMATION - Process Slices and Apply Judge
// ============================================================================

const runAutomation = (events, eventStore) => {
`;

  const userBlocks = [];
  const processorBlocks = [];

  console.log(`  → Processing user-initiated commands...`);
  stateChangeSlices.forEach(slice => {
    slice.commands.forEach(command => {
      const isUserInitiated = command.dependencies.some(d => d.type === 'INBOUND' && d.elementType === 'SCREEN');
      if (!isUserInitiated) return;

      const commandFnName = toValidFunctionName(command.title);
      console.log(`    ✓ User command: ${command.title}`);

      userBlocks.push(
        renderAutomationUserBlock({
          title: command.title,
          commandFnName
        })
      );
    });
  });

  console.log(`  → Processing automation-triggered commands...`);
  automationSlices.forEach(slice => {
    slice.processors.forEach(processor => {
      const readmodelDep = processor.dependencies.find(d => d.type === 'INBOUND' && d.elementType === 'READMODEL');
      const commandDep = processor.dependencies.find(d => d.type === 'OUTBOUND' && d.elementType === 'COMMAND');

      if (!readmodelDep || !commandDep) {
        return;
      }

      const idField = processor.fields.find(f => f.name.includes('Id'));
      if (!idField) {
        console.warn(`⚠️ Skipping automation block for ${processor.title} — missing id field`);
        return;
      }

      const entityVar = toValidVariableName(readmodelDep.title);
      const commandFnName = toValidFunctionName(commandDep.title);
      const lockVarName = `inFlight${commandFnName}`;
      const pendingSetVar = `${entityVar}PendingSet`;

      automationLocks.push(lockVarName);

      console.log(`    ✓ Automation: ${processor.title} → ${commandDep.title}`);

      processorBlocks.push(
        renderAutomationProcessorBlock({
          processorTitle: processor.title,
          entityVar,
          idFieldName: idField.name,
          commandFnName,
          lockVarName,
          pendingSetVar
        })
      );
    });
  });

  const footer = `};

`;

  const commandDispatch = `startCommandDispatcher({ judge, eventStore, mockRabbitMQ });

`;

  const lockDeclarations = automationLocks.length
    ? `${automationLocks.map(name => `const ${name} = new Set();`).join('\n')}\n\n`
    : '';

  return {
    imports: importLines ? `${importLines}\n\n` : '',
    code: lockDeclarations + header + userBlocks.join('') + processorBlocks.join('') + footer + commandDispatch
  };
}
