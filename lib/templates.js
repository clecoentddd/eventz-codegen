// Template renderers for generated code snippets

export const renderCommandTemplate = ({
  commandName,
  functionSignature,
  attemptedEventName,
  generatedFields,
  fields
}) => {
  const signature = functionSignature || '';
  const generatedAssignments = generatedFields
    .map(({ name, overrideName, prefix }) => `  const ${name} = ${overrideName} ?? \`${prefix}_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;`)
    .join('\n');

  const dataLines = fields
    .map(({ propertyAccessor, variableName }) => `      ${propertyAccessor}: ${variableName},`)
    .join('\n');

  return `export const ${commandName} = (${signature}) => {
${generatedAssignments ? generatedAssignments + '\n\n' : ''}  return {
    type: '${attemptedEventName}',
    data: {
${dataLines}
    }
  };
};

`;
};

export const renderProcessAttemptsTemplate = ({
  title,
  sliceName,
  attemptedEventType,
  approvedEventType,
  rejectedEventType
}) => `// STATE CHANGE: Process ${title} attempts handled via RabbitMQ queue (${attemptedEventType}).
export const ${sliceName} = (events) => {
  return {
    attempted: events.filter(e => e.type === '${attemptedEventType}'),
    approved: events.filter(e => e.type === '${approvedEventType}'),
    rejected: events.filter(e => e.type === '${rejectedEventType}')
  };
};

`;

export const renderAutomationSliceTemplate = ({
  processorTitle,
  sliceName,
  projectionName,
  idFieldName,
  approvedEventType,
  attemptedEventType
}) => `// STATE CHANGE: Automation slice for ${processorTitle}
export const ${sliceName} = (events) => {
  const pendingEntities = ${projectionName}(events);
  const entityIds = Object.keys(pendingEntities);
  
  const processedIds = new Set(
    events
      .filter(e => e.type === '${approvedEventType}')
      .map(e => e.data.${idFieldName})
  );
  
  const attemptedIds = new Set(
    events
      .filter(e => e.type === '${attemptedEventType}')
      .map(e => e.data.${idFieldName})
  );
  
  return entityIds.filter(id => !processedIds.has(id) && !attemptedIds.has(id));
};

`;

export const renderAutomationUserBlock = ({
  title,
  commandFnName
}) => `  // User-initiated ${title} attempts are published via RabbitMQ handlers.
`;

export const renderAutomationProcessorBlock = ({
  processorTitle,
  entityVar,
  idFieldName,
  commandFnName,
  lockVarName,
  pendingSetVar
}) => `  // Automation: ${processorTitle}
  const ${entityVar}NeedingAction = process${commandFnName}Slice(events);
  const ${pendingSetVar} = new Set(${entityVar}NeedingAction);

  ${lockVarName}.forEach(id => {
    if (!${pendingSetVar}.has(id)) {
      ${lockVarName}.delete(id);
    }
  });

  ${entityVar}NeedingAction.forEach(${idFieldName} => {
    if (${lockVarName}.has(${idFieldName})) {
      return;
    }

    ${lockVarName}.add(${idFieldName});
    const attemptEvent = attempt${commandFnName}(${idFieldName});
    mockRabbitMQ.publish('commands', 'attempts', attemptEvent).catch((err) => {
      console.error('Failed to publish automation attempt', err);
      ${lockVarName}.delete(${idFieldName});
    });
  });
  
`;

export const renderInputFieldTemplate = ({ stateVar, setterName, placeholder }) => `              <input
                type="text"
                value={${stateVar}}
                onChange={(e) => ${setterName}(e.target.value)}
                placeholder="${placeholder}"
                className="w-full px-4 py-2 rounded bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
`;

export const renderProjectionViewTemplate = ({
  title,
  entityVar,
  idFieldName,
  displayFields
}) => `          {/* ${title} */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-blue-500/50">
            <h2 className="text-xl font-bold text-white mb-3">
              ${title} ({Object.keys(${entityVar}s).length})
            </h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {Object.values(${entityVar}s).map(item => (
                <div key={item.${idFieldName}} className="p-3 bg-blue-500/20 border border-blue-500/50 rounded">
${displayFields.map(field => `                  <div className="text-white text-sm">${field}: {item.${field}}</div>`).join('\n')}
                </div>
              ))}
              {Object.keys(${entityVar}s).length === 0 && (
                <p className="text-purple-200">No items yet</p>
              )}
            </div>
          </div>

`;

export const renderProjectionTemplate = ({
  title,
  projectionName,
  collectionName,
  idFieldName,
  idFieldAccessor,
  fields,
  eventTypes
}) => `// STATE VIEW: ${title}
export const ${projectionName} = (events) => {
  return events.reduce((${collectionName}, event) => {
    switch (event.type) {
${eventTypes.map(eventType => `      case '${eventType}':
        ${collectionName}[${idFieldAccessor}] = {
${fields.map(field => `          ${field.propertyAccessor}: ${field.dataAccessor},`).join('\n')}
          createdAt: event.timestamp
        };
        break;`).join('\n')}
      default:
        break;
    }
    return ${collectionName};
  }, {});
};

`;

export const renderTodoProjectionTemplate = ({
  title,
  projectionName,
  collectionName,
  idFieldName,
  idFieldAccessor,
  fields,
  addEventTypes,
  removeEventTypes
}) => `// STATE VIEW: ${title} (TODO)
export const ${projectionName} = (events) => {
  return events.reduce((${collectionName}, event) => {
    switch (event.type) {
${addEventTypes.map(eventType => `      case '${eventType}':
        ${collectionName}[${idFieldAccessor}] = {
${fields.map(field => `          ${field.propertyAccessor}: ${field.dataAccessor},`).join('\n')}
          createdAt: event.timestamp
        };
        break;`).join('\n')}
${removeEventTypes.map(eventType => `      case '${eventType}':
        delete ${collectionName}[${idFieldAccessor}];
        break;`).join('\n')}
      default:
        break;
    }
    return ${collectionName};
  }, {});
};

`;
