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

      console.log(`    ✓ Automation: ${processor.title} → ${commandDep.title}`);

      processorBlocks.push(
        renderAutomationProcessorBlock({
          processorTitle: processor.title,
          entityVar,
          idFieldName: idField.name,
          commandFnName
        })
      );
    });
  });

  const footer = `};

`;

  const commandDispatch = `const COMMAND_EXCHANGE = 'commands';
const COMMAND_ROUTING_KEY = 'attempts';
const AUDIT_EXCHANGE = 'audit';
const AUDIT_ROUTING_KEY = 'errors';

const startCommandDispatcher = (() => {
  let started = false;
  return () => {
    if (started) {
      return;
    }
    started = true;

    mockRabbitMQ.subscribe(COMMAND_EXCHANGE, COMMAND_ROUTING_KEY, async (intentEvent) => {
      const history = eventStore.getAllEvents();
      try {
        const decision = judge(intentEvent, history);
        const outcomeEvent = decision.approved ? decision.approvalEvent : decision.rejectionEvent;

        if (outcomeEvent) {
          eventStore.append(outcomeEvent);
          return;
        }

        const auditEnvelope = {
          type: 'CommandUnhandled',
          data: {
            attemptType: intentEvent.type,
            attemptId: intentEvent.id ?? null,
            reason: 'Judge returned no outcome event.'
          }
        };

        mockRabbitMQ.publish(AUDIT_EXCHANGE, AUDIT_ROUTING_KEY, auditEnvelope).catch((err) => {
          console.error('Failed to publish audit event', err);
        });
      } catch (error) {
        const auditEnvelope = {
          type: 'CommandFailed',
          data: {
            attemptType: intentEvent.type,
            attemptId: intentEvent.id ?? null,
            error: error?.message || 'Unknown error'
          }
        };

        mockRabbitMQ.publish(AUDIT_EXCHANGE, AUDIT_ROUTING_KEY, auditEnvelope).catch((err) => {
          console.error('Failed to publish audit event', err);
        });
      }
    });
  };
})();

startCommandDispatcher();

`;

  return {
    imports: importLines ? `${importLines}\n\n` : '',
    code: header + userBlocks.join('') + processorBlocks.join('') + footer + commandDispatch
  };
}
