// ============================================================================
// EVENTZ CODE GENERATOR
// Generates complete event-sourced applications from JSON configuration
// ============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { validateConfiguration } from './lib/validation.js';
import { generateJudgeRules } from './lib/generators/judge.js';
import { generateProjections } from './lib/generators/projections.js';
import { generateStateChangeSlices } from './lib/generators/state-change.js';
import { generateCommands } from './lib/generators/commands.js';
import { generateAutomation } from './lib/generators/automation.js';
import { generateReactUI } from './lib/generators/react-ui.js';
import { selectConfigFile } from './lib/config-selection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// MAIN GENERATOR
// ============================================================================

function generateApplication(config) {
  const slices = config.slices;

  let code = `import React, { useState, useEffect } from 'react';
import { eventStore, mockRabbitMQ } from './eventz-runtime';

// Generated from EventZ configuration: ${config.context}
// Total slices: ${slices.length}

`;

  code += generateJudgeRules(slices);
  code += generateProjections(slices);
  code += generateStateChangeSlices(slices);
  code += generateCommands(slices);
  code += generateAutomation(slices);
  code += generateReactUI(slices, config);

  return code;
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

const main = async () => {
  const configPath = await selectConfigFile(__dirname);
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  console.log('\n🔍 Validating configuration...');
  validateConfiguration(config);

  const generatedCode = generateApplication(config);

  const outputDir = path.resolve(__dirname, './src');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.resolve(outputDir, 'GeneratedApp.jsx');
  fs.writeFileSync(outputPath, generatedCode);

  console.log(`✅ Application generated successfully! Output written to ${outputPath}`);
};

main().catch((error) => {
  console.error('❌ Generation failed:', error);
  process.exit(1);
});
