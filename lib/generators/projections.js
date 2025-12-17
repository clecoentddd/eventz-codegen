import {
  toValidFunctionName,
  toValidVariableName,
  extractEntityName,
  toObjectPropertyKey,
  toDataAccessor,
  inferTodoAction,
  toPascalCase
} from '../helpers.js';
import {
  renderProjectionTemplate,
  renderTodoProjectionTemplate
} from '../templates.js';

// Build projection functions for read models
export function generateProjections(slices) {
  const stateViewSlices = slices.filter(s => s.sliceType === 'STATE_VIEW');
  const commandByTitle = new Map();
  const processorsByReadmodel = new Map();
  const directoryCounts = new Map();

  slices.forEach(slice => {
    (slice.commands || []).forEach(command => {
      commandByTitle.set(command.title, command);
    });

    (slice.processors || []).forEach(processor => {
      (processor.dependencies || [])
        .filter(dep => dep.type === 'INBOUND' && dep.elementType === 'READMODEL')
        .forEach(dep => {
          const existing = processorsByReadmodel.get(dep.title) || [];
          existing.push(processor);
          processorsByReadmodel.set(dep.title, existing);
        });
    });
  });
  
  console.log(`\n📊 Generating Projections for ${stateViewSlices.length} STATE_VIEW slices...`);

  const modules = [];
  const importMap = new Map();
  const registry = new Map();

  stateViewSlices.forEach(slice => {
    const baseDirName = toPascalCase(slice.title) || 'StateViewSlice';
    const occurrence = directoryCounts.get(baseDirName) || 0;
    directoryCounts.set(baseDirName, occurrence + 1);
    const sliceDirName = occurrence === 0 ? baseDirName : `${baseDirName}_${occurrence + 1}`;
    const relativeDir = `slices/state-view/${sliceDirName}`;
    const importPath = `./${relativeDir}/index.js`;
    const sectionParts = [
      `// ============================================================================`,
      `// STATE VIEW SLICE: ${slice.title}`,
      `// ============================================================================\n`
    ];
    let hasContent = false;

    (slice.readmodels || []).forEach(readmodel => {
      const inboundEvents = (readmodel.dependencies || [])
        .filter(d => d.type === 'INBOUND' && d.elementType === 'EVENT');

      if (inboundEvents.length === 0) {
        console.warn(`⚠️ Skipping projection ${readmodel.title} — missing inbound event dependency`);
        return;
      }

      const primaryEventTitle = inboundEvents[0].title;
      const entityName = extractEntityName(primaryEventTitle);
      const projectionName = toValidVariableName(readmodel.title) + 'Projection';
      const collectionBase = toValidVariableName(entityName) || 'items';
      const collectionName = collectionBase.endsWith('s') ? collectionBase : `${collectionBase}s`;
      const idField = (readmodel.fields || []).find(f => f.idAttribute);

      if (!idField) {
        console.warn(`⚠️ Skipping projection ${readmodel.title} — missing id field`);
        return;
      }

      const projectionFields = (readmodel.fields || []).map(field => ({
        propertyAccessor: toObjectPropertyKey(field.name),
        dataAccessor: toDataAccessor('event.data', field.name)
      }));
      const eventTypes = inboundEvents.map(dep => toValidFunctionName(dep.title));
      const idFieldAccessor = toDataAccessor('event.data', idField.name);

      const relatedProcessors = processorsByReadmodel.get(readmodel.title) || [];
      const inboundAddSet = new Set();
      const inboundRemoveSet = new Set();

      inboundEvents.forEach(dep => {
        const eventType = toValidFunctionName(dep.title);
        if (inferTodoAction(dep.title) === 'REMOVE') {
          inboundRemoveSet.add(eventType);
        } else {
          inboundAddSet.add(eventType);
        }
      });

      const processorRemovalSet = new Set();
      relatedProcessors.forEach(processor => {
        const commandDep = (processor.dependencies || []).find(d => d.type === 'OUTBOUND' && d.elementType === 'COMMAND');
        if (!commandDep) {
          return;
        }

        const command = commandByTitle.get(commandDep.title);
        if (!command) {
          return;
        }

        const outboundEvent = (command.dependencies || []).find(d => d.type === 'OUTBOUND' && d.elementType === 'EVENT');
        if (!outboundEvent) {
          return;
        }

        processorRemovalSet.add(toValidFunctionName(outboundEvent.title));
      });

      const removeSet = new Set([...inboundRemoveSet, ...processorRemovalSet]);
      const addSet = new Set([...inboundAddSet]);

      removeSet.forEach(eventType => {
        if (addSet.has(eventType)) {
          addSet.delete(eventType);
        }
      });

      let addEventTypes = Array.from(addSet);
      const removeEventTypes = Array.from(removeSet);

      if (addEventTypes.length === 0) {
        const fallback = eventTypes.find(eventType => !removeSet.has(eventType));
        if (fallback) {
          addEventTypes = [fallback];
        }
      }

      const isTodoProjection = addEventTypes.length > 0 && (
        inboundEvents.length > 1 ||
        relatedProcessors.length > 0 ||
        removeEventTypes.length > 0 ||
        Boolean(readmodel.listElement)
      );

      if (isTodoProjection) {
        sectionParts.push(
          renderTodoProjectionTemplate({
            title: readmodel.title,
            projectionName,
            collectionName,
            idFieldName: idField.name,
            idFieldAccessor,
            fields: projectionFields,
            addEventTypes,
            removeEventTypes
          })
        );
      } else {
        sectionParts.push(
          renderProjectionTemplate({
            title: readmodel.title,
            projectionName,
            collectionName,
            idFieldName: idField.name,
            idFieldAccessor,
            fields: projectionFields,
            eventTypes
          })
        );
      }

      hasContent = true;

      const existing = importMap.get(importPath) || new Set();
      existing.add(projectionName);
      importMap.set(importPath, existing);
      registry.set(projectionName, importPath);
    });

    if (hasContent) {
      const moduleContent = sectionParts
        .filter(Boolean)
        .join('\n');
      modules.push({
        path: `${relativeDir}/index.js`,
        content: moduleContent.endsWith('\n') ? moduleContent : `${moduleContent}\n`
      });
    }
  });

  const imports = Array.from(importMap.entries()).map(([path, names]) => ({
    path,
    names: Array.from(names)
  }));

  return { modules, imports, registry };
}
