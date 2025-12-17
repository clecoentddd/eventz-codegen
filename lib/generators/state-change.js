import { toValidFunctionName, toValidVariableName } from '../helpers.js';
import {
  renderAutomationSliceTemplate,
  renderProcessAttemptsTemplate
} from '../templates.js';

// Build state change slices for intent processing
export function generateStateChangeSlices(slices) {
  const stateChangeSlices = slices.filter(s => s.sliceType === 'STATE_CHANGE');
  
  const header = `// ============================================================================
// STATE CHANGE SLICES - Process Intents
// ============================================================================

`;

  const generatedSlices = new Set();
  const sliceSections = [];

  stateChangeSlices.forEach(slice => {
    slice.commands.forEach(command => {
      const commandFnName = toValidFunctionName(command.title);
      const attemptedEventType = commandFnName + 'Attempted';
      const approvedEventTitle = command.dependencies.find(d => d.type === 'OUTBOUND' && d.elementType === 'EVENT')?.title || command.title.replace('create', 'Created');
      const approvedEventType = toValidFunctionName(approvedEventTitle);
      const rejectedEventType = approvedEventType + 'Rejected';
      const sliceName = 'process' + commandFnName + 'Slice';

      if (generatedSlices.has(sliceName)) {
        return;
      }
      generatedSlices.add(sliceName);

      const isAutomated = command.dependencies.some(d => d.type === 'INBOUND' && d.elementType === 'AUTOMATION');

      if (isAutomated) {
        const processor = slices
          .flatMap(s => s.processors || [])
          .find(p => p.dependencies.some(d => d.elementType === 'COMMAND' && d.title === command.title));

        if (!processor) {
          console.warn(`⚠️ Skipping automation slice for ${command.title} — processor definition missing`);
          return;
        }

        const readmodelDep = processor.dependencies.find(d => d.type === 'INBOUND' && d.elementType === 'READMODEL');
        const idField = processor.fields.find(f => f.name.includes('Id'));

        if (!readmodelDep || !idField) {
          console.warn(`⚠️ Skipping automation slice for ${processor.title} — missing readmodel or id field`);
          return;
        }

        const projectionName = toValidVariableName(readmodelDep.title) + 'Projection';

        sliceSections.push(
          renderAutomationSliceTemplate({
            processorTitle: processor.title,
            sliceName,
            projectionName,
            idFieldName: idField.name,
            approvedEventType,
            attemptedEventType
          })
        );
      } else {
        sliceSections.push(
          renderProcessAttemptsTemplate({
            title: command.title,
            sliceName,
            attemptedEventType,
            approvedEventType,
            rejectedEventType
          })
        );
      }
    });
  });

  return header + sliceSections.join('');
}
