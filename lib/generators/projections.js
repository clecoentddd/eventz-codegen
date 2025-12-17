import {
  toValidFunctionName,
  toValidVariableName,
  extractEntityName,
  toObjectPropertyKey,
  toDataAccessor,
  inferTodoAction
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
  
  const header = `// ============================================================================
// STATE VIEW SLICES - Projections (Read Models)
// ============================================================================

`;

  const projectionSections = [];

  stateViewSlices.forEach(slice => {
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
        projectionSections.push(
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
        projectionSections.push(
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
    });
  });

  return header + projectionSections.join('');
}
