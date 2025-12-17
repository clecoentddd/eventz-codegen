import {
  toValidFunctionName,
  toCamelCase,
  toPascalCase,
  toValidVariableName,
  extractEntityName
} from '../helpers.js';
import {
  renderInputFieldTemplate,
  renderProjectionViewTemplate
} from '../templates.js';

// Generate the React UI shell
export function generateReactUI(slices, config, options = {}) {
  const { projectionImports = [], commandImports = [] } = options;
  const importMap = new Map();

  projectionImports.forEach(({ path, names }) => {
    const existing = importMap.get(path) || new Set();
    names.forEach(name => existing.add(name));
    importMap.set(path, existing);
  });

  commandImports
    .filter(({ userInitiated }) => userInitiated)
    .forEach(({ path, name }) => {
      const existing = importMap.get(path) || new Set();
      existing.add(name);
      importMap.set(path, existing);
    });

  const importLines = Array.from(importMap.entries())
    .map(([path, names]) => `import { ${Array.from(names).join(', ')} } from '${path}';`)
    .join('\n');
  const stateChangeSlices = slices.filter(s => s.sliceType === 'STATE_CHANGE');
  const stateViewSlices = slices.filter(s => s.sliceType === 'STATE_VIEW');
  const interpolationStart = '${';
  const interpolationEnd = '}';
  
  const userCommands = stateChangeSlices
    .flatMap(slice => slice.commands || [])
    .filter(command => command.dependencies.some(d => d.type === 'INBOUND' && d.elementType === 'SCREEN'))
    .map(command => {
      const commandFnName = toValidFunctionName(command.title);
      const commandName = 'attempt' + commandFnName;
      const handlerName = 'handle' + commandFnName;

      const inputFields = (command.fields || [])
        .filter(f => !f.generated)
        .map(field => {
          const stateVar = toCamelCase(commandFnName) + toPascalCase(field.name);
          const setterName = 'set' + toPascalCase(commandFnName) + toPascalCase(field.name);
          return {
            name: field.name,
            stateVar,
            setterName
          };
        });

      const paramList = inputFields.map(f => f.stateVar).join(', ');

      return {
        title: command.title,
        commandName,
        handlerName,
        commandFnName,
        inputFields,
        paramList
      };
    });
  
  let code = `// ============================================================================
// REACT UI
// ============================================================================

export default function EventZApp() {
  const [events, setEvents] = useState([]);
`;

  userCommands.forEach(command => {
    command.inputFields.forEach(field => {
      code += `  const [${field.stateVar}, ${field.setterName}] = useState('');\n`;
    });
  });

  code += `  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let isProcessing = false;
    let needsReplay = false;

    const processQueue = () => {
      if (isProcessing) {
        needsReplay = true;
        return;
      }

      isProcessing = true;
      setTimeout(() => {
        runAutomation(eventStore.getAllEvents(), eventStore);
        isProcessing = false;

        if (needsReplay) {
          needsReplay = false;
          processQueue();
        }
      }, 0);
    };

    const unsubscribe = eventStore.subscribe((allEvents) => {
      setEvents(allEvents);
      processQueue();
    });

    return unsubscribe;
  }, []);

  // Build projections
`;

  stateViewSlices.forEach(slice => {
    slice.readmodels.forEach(readmodel => {
      const eventName = readmodel.dependencies.find(d => d.type === 'INBOUND' && d.elementType === 'EVENT')?.title || '';
      const entityName = extractEntityName(eventName);
      const projectionName = toValidVariableName(readmodel.title) + 'Projection';
      code += `  const ${toValidVariableName(entityName)}s = ${projectionName}(events);\n`;
    });
  });

  // Generate handlers
  userCommands.forEach(command => {
    code += `
  const ${command.handlerName} = () => {
    setError('');
    setSuccess('');
    
    const intentEvent = ${command.commandName}(${command.paramList});
    mockRabbitMQ.publish('commands', 'attempts', intentEvent)
      .catch((err) => {
        console.error('Failed to publish command', err);
        setError('Failed to queue ${command.title}');
      });
`;

    command.inputFields.forEach(field => {
      code += `    ${field.setterName}('');\n`;
    });

    code += `  };
`;
  });

  code += `
  const rejections = events.filter(e => 
    e.type.includes('Rejected')
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">
          ${config.context || 'EventZ Application'}
        </h1>
        <p className="text-purple-200 mb-8">Event Sourcing with Judge Pattern</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
`;

  if (userCommands.length > 0) {
    userCommands.forEach(command => {
      code += `          {/* ${command.title} */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">${command.title}</h2>
            <div className="space-y-4">
`;

      command.inputFields.forEach(field => {
        code += renderInputFieldTemplate({
          stateVar: field.stateVar,
          setterName: field.setterName,
          placeholder: field.name
        });
      });

      code += `              <button
                onClick={${command.handlerName}}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium transition-colors"
              >
                ${command.title}
              </button>
              {success && <div className="p-3 bg-green-500/20 border border-green-500/50 rounded text-green-200">{success}</div>}
              {error && <div className="p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200">{error}</div>}
            </div>
          </div>

`;
    });
  } else {
    code += `          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">Commands</h2>
            <p className="text-purple-200">No user-triggered commands available.</p>
          </div>

`;
  }

  code += `
          {/* Judge Rejections */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">Judge Rejections</h2>
            {rejections.length === 0 ? (
              <p className="text-green-200">All attempts approved!</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {rejections.slice().reverse().map(rejection => (
                  <div key={rejection.id} className="p-3 bg-red-500/20 border border-red-500/50 rounded">
                    <div className="text-red-200 text-sm">{rejection.data.reason}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
`;

  // Generate projection views
  stateViewSlices.forEach(slice => {
    slice.readmodels.forEach(readmodel => {
      const eventName = readmodel.dependencies.find(d => d.type === 'INBOUND' && d.elementType === 'EVENT')?.title || '';
      const entityName = extractEntityName(eventName);
      const entityVarName = toValidVariableName(entityName);
      const idField = readmodel.fields.find(f => f.idAttribute && f.name.includes('Id'));
      if (!idField) {
        return;
      }

      const displayFields = readmodel.fields
        .filter(f => !f.name.includes('Id') || f.idAttribute)
        .map(f => f.name);

      code += renderProjectionViewTemplate({
        title: readmodel.title,
        entityVar: entityVarName,
        idFieldName: idField.name,
        displayFields
      });
    });
  });

  code += `        </div>

        {/* Event Stream */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">Event Stream ({events.length})</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.slice().reverse().map((event) => (
              <div key={event.id} className={
                  \`p-3 rounded font-mono text-sm ${interpolationStart}
                    event.type.includes('Attempted') ? 'bg-yellow-500/20 border border-yellow-500/50' :
                    event.type.includes('Rejected') ? 'bg-red-500/20 border border-red-500/50' :
                    'bg-green-500/20 border border-green-500/50'
                  ${interpolationEnd}\`
              }>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-white font-bold">{event.type}</span>
                  <span className="text-white/70 text-xs">{new Date(event.timestamp).toLocaleTimeString()}</span>
                </div>
                <pre className="text-white/90 text-xs overflow-x-auto">
                  {JSON.stringify(event.data, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
`;

  return {
    imports: importLines ? `${importLines}\n\n` : '',
    code
  };
}
