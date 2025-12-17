import {
  toValidFunctionName,
  toValidVariableName,
  deriveIdPrefix,
  toObjectPropertyKey
} from '../helpers.js';
import { renderCommandTemplate } from '../templates.js';

// Generate command creator functions
export function generateCommands(slices) {
  const stateChangeSlices = slices.filter(s => s.sliceType === 'STATE_CHANGE');
  
  console.log(`\n⚡ Generating Commands...`);
  
  const header = `// ============================================================================
// COMMAND HANDLERS - Create Intent Events
// ============================================================================

`;

  const commandSections = [];

  stateChangeSlices.forEach(slice => {
    slice.commands.forEach(command => {
      const commandFnName = toValidFunctionName(command.title);
      const commandName = 'attempt' + commandFnName;
      const attemptedEventName = commandFnName + 'Attempted';

      const fieldEntries = (command.fields || []).map(field => {
        const variableName = toValidVariableName(field.name);
        const safeProperty = toObjectPropertyKey(field.name);

        return {
          ...field,
          variableName,
          propertyAccessor: safeProperty
        };
      });

      const requiredParams = fieldEntries
        .filter(f => !f.generated)
        .map(f => f.variableName);
      const overrideParams = fieldEntries
        .filter(f => f.generated)
        .map(f => `${f.variableName}Override`);
      const functionSignature = [...requiredParams, ...overrideParams].join(', ');

      console.log(`  ✓ Command: ${commandName}(${functionSignature}) → ${attemptedEventName}`);

      const generatedFields = fieldEntries
        .filter(f => f.generated)
        .map(f => ({
          name: f.variableName,
          overrideName: `${f.variableName}Override`,
          prefix: deriveIdPrefix(f.name)
        }));

      commandSections.push(
        renderCommandTemplate({
          commandName,
          functionSignature,
          attemptedEventName,
          generatedFields,
          fields: fieldEntries.map(f => ({
            propertyAccessor: f.propertyAccessor,
            variableName: f.variableName
          }))
        })
      );
    });
  });

  return header + commandSections.join('');
}
