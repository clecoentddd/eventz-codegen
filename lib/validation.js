// Configuration validation routines

export function validateConfiguration(config) {
  const errors = [];
  
  config.slices.forEach(slice => {
    if (slice.processors && slice.processors.length > 0) {
      slice.processors.forEach(processor => {
        const hasInboundReadmodel = processor.dependencies.some(
          d => d.type === 'INBOUND' && d.elementType === 'READMODEL'
        );
        
        if (!hasInboundReadmodel) {
          errors.push(
            `ERROR: INBOUND READMODEL MISSING IN SLICE "${slice.title}" (index ${slice.index})\n` +
            `  Processor: "${processor.title}"\n` +
            '  Processors must have an INBOUND dependency from a READMODEL to know what triggers them.'
          );
        }
        
        const hasOutboundCommand = processor.dependencies.some(
          d => d.type === 'OUTBOUND' && d.elementType === 'COMMAND'
        );
        
        if (!hasOutboundCommand) {
          errors.push(
            `ERROR: OUTBOUND COMMAND MISSING IN SLICE "${slice.title}" (index ${slice.index})\n` +
            `  Processor: "${processor.title}"\n` +
            '  Processors must have an OUTBOUND dependency to a COMMAND.'
          );
        }
      });
    }
    
    if (slice.commands && slice.commands.length > 0) {
      slice.commands.forEach(command => {
        const hasOutboundEvent = command.dependencies.some(
          d => d.type === 'OUTBOUND' && d.elementType === 'EVENT'
        );
        
        if (!hasOutboundEvent) {
          errors.push(
            `ERROR: OUTBOUND EVENT MISSING IN SLICE "${slice.title}" (index ${slice.index})\n` +
            `  Command: "${command.title}"\n` +
            '  Commands must produce an OUTBOUND EVENT.'
          );
        }
      });
    }
    
    if (slice.readmodels && slice.readmodels.length > 0) {
      slice.readmodels.forEach(readmodel => {
        const hasInboundEvent = readmodel.dependencies.some(
          d => d.type === 'INBOUND' && d.elementType === 'EVENT'
        );
        
        if (!hasInboundEvent) {
          errors.push(
            `ERROR: INBOUND EVENT MISSING IN SLICE "${slice.title}" (index ${slice.index})\n` +
            `  ReadModel: "${readmodel.title}"\n` +
            '  ReadModels must have an INBOUND EVENT to project from.'
          );
        }
      });
    }
  });
  
  if (errors.length > 0) {
    console.error('\n❌ CONFIGURATION VALIDATION FAILED\n');
    console.error('='.repeat(80));
    errors.forEach(error => {
      console.error('\n' + error + '\n');
      console.error('-'.repeat(80));
    });
    console.error('\nPlease fix the configuration errors above before generating code.\n');
    process.exit(1);
  }

  console.log('✅ Configuration validation passed');
}
