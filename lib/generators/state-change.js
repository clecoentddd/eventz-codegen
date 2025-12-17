import path from 'path';
import {
  toValidFunctionName,
  toValidVariableName,
  toPascalCase,
  toObjectPropertyKey,
  deriveIdPrefix
} from '../helpers.js';
import {
  renderAutomationSliceTemplate,
  renderProcessAttemptsTemplate,
  renderCommandTemplate
} from '../templates.js';

const posixPath = path.posix;

const ensureRelativeImportPath = (fromFile, targetImportPath) => {
  const normalizedTarget = targetImportPath.replace(/^\.\//, '');
  const fromDir = posixPath.dirname(fromFile);
  let relative = posixPath.relative(fromDir, normalizedTarget);
  if (!relative.startsWith('.')) {
    relative = `./${relative}`;
  }
  return relative;
};

const collectFieldEntries = (command) => {
  return (command.fields || []).map(field => {
    const variableName = toValidVariableName(field.name);
    return {
      ...field,
      variableName,
      propertyAccessor: toObjectPropertyKey(field.name)
    };
  });
};

// Build state change slices for intent processing
export function generateStateChangeSlices(slices, options = {}) {
  const { projectionRegistry = new Map() } = options;
  const stateChangeSlices = slices.filter(s => s.sliceType === 'STATE_CHANGE');

  const modules = [];
  const commandMeta = [];
  const automationMeta = [];
  const directoryCounts = new Map();

  stateChangeSlices.forEach(slice => {
    const baseDirName = toPascalCase(slice.title) || 'StateChangeSlice';
    const occurrence = directoryCounts.get(baseDirName) || 0;
    directoryCounts.set(baseDirName, occurrence + 1);
    const sliceDirName = occurrence === 0 ? baseDirName : `${baseDirName}_${occurrence + 1}`;
    const relativeDir = `slices/state-change/${sliceDirName}`;
    const modulePath = `${relativeDir}/index.js`;
    const consumerImportPath = `./${modulePath}`;

    const localImports = new Map();
    const sections = [`// ============================================================================`,
      `// STATE CHANGE SLICE: ${slice.title}`,
      `// ============================================================================\n`];

    (slice.commands || []).forEach(command => {
      const commandFnName = toValidFunctionName(command.title);
      const commandName = `attempt${commandFnName}`;
      const attemptedEventType = `${commandFnName}Attempted`;
      const approvedEventTitle = command.dependencies.find(d => d.type === 'OUTBOUND' && d.elementType === 'EVENT')?.title || command.title.replace('create', 'Created');
      const approvedEventType = toValidFunctionName(approvedEventTitle);
      const rejectedEventType = `${approvedEventType}Rejected`;
      const sliceName = `process${commandFnName}Slice`;

      const fieldEntries = collectFieldEntries(command);
      const requiredParams = fieldEntries.filter(f => !f.generated).map(f => f.variableName);
      const overrideParams = fieldEntries.filter(f => f.generated).map(f => `${f.variableName}Override`);
      const functionSignature = [...requiredParams, ...overrideParams].join(', ');
      const generatedFields = fieldEntries
        .filter(f => f.generated)
        .map(f => ({
          name: f.variableName,
          overrideName: `${f.variableName}Override`,
          prefix: deriveIdPrefix(f.name)
        }));

      sections.push(renderCommandTemplate({
        commandName,
        functionSignature,
        attemptedEventName: attemptedEventType,
        generatedFields,
        fields: fieldEntries.map(f => ({
          propertyAccessor: f.propertyAccessor,
          variableName: f.variableName
        }))
      }));

      const isUserInitiated = command.dependencies.some(d => d.type === 'INBOUND' && d.elementType === 'SCREEN');
      commandMeta.push({
        title: command.title,
        name: commandName,
        path: consumerImportPath,
        userInitiated: isUserInitiated
      });

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
        const projectionImportPath = projectionRegistry.get(projectionName);

        if (!projectionImportPath) {
          console.warn(`⚠️ Missing projection export for ${projectionName} referenced by ${processor.title}`);
        } else {
          const relativeImport = ensureRelativeImportPath(modulePath, projectionImportPath);
          const existing = localImports.get(relativeImport) || new Set();
          existing.add(projectionName);
          localImports.set(relativeImport, existing);
        }

        sections.push(
          renderAutomationSliceTemplate({
            processorTitle: processor.title,
            sliceName,
            projectionName,
            idFieldName: idField.name,
            approvedEventType,
            attemptedEventType
          })
        );

        automationMeta.push({
          commandTitle: command.title,
          processName: sliceName,
          attemptName: commandName,
          path: consumerImportPath
        });
      } else {
        sections.push(renderProcessAttemptsTemplate({
          title: command.title,
          sliceName,
          attemptedEventType,
          approvedEventType,
          rejectedEventType
        }));
      }
    });

    const importLines = Array.from(localImports.entries())
      .map(([importPath, names]) => `import { ${Array.from(names).join(', ')} } from '${importPath}';`)
      .join('\n');

    const sectionBody = sections.join('\n');
    const moduleContent = `${importLines ? `${importLines}\n\n` : ''}${sectionBody}`;
    modules.push({ path: modulePath, content: moduleContent });
  });

  const uniqueCommands = [];
  const seenCommands = new Set();
  commandMeta.forEach(meta => {
    if (seenCommands.has(meta.name)) {
      return;
    }
    seenCommands.add(meta.name);
    uniqueCommands.push(meta);
  });

  const uniqueAutomation = [];
  const seenProcesses = new Set();
  automationMeta.forEach(meta => {
    if (seenProcesses.has(meta.processName)) {
      return;
    }
    seenProcesses.add(meta.processName);
    uniqueAutomation.push(meta);
  });

  return {
    modules,
    commands: uniqueCommands,
    automation: uniqueAutomation
  };
}
