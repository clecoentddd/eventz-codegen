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

  const extraFiles = [];

  let code = `import React, { useState, useEffect } from 'react';
import { eventStore, mockRabbitMQ, startCommandDispatcher } from './eventz-runtime';
`;

  const { modules: projectionModules, imports: projectionImports, registry: projectionRegistry } = generateProjections(slices);
  extraFiles.push(...projectionModules);

  const { modules: stateChangeModules, commands: commandImports, automation: automationImports } = generateStateChangeSlices(slices, { projectionRegistry });
  extraFiles.push(...stateChangeModules);

  const reactUI = generateReactUI(slices, config, { projectionImports, commandImports });
  const automation = generateAutomation(slices, { automationImports });

  const importBlocks = [reactUI.imports, automation.imports].filter(Boolean).join('');
  code += importBlocks ? `\n${importBlocks}` : '\n';

  code += `// Generated from EventZ configuration: ${config.context}
// Total slices: ${slices.length}

`;

  code += generateJudgeRules(slices);
  code += automation.code;
  code += reactUI.code;

  return { mainCode: code, extraFiles };
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

const main = async () => {
  const configPath = await selectConfigFile(__dirname);
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  console.log('\n🔍 Validating configuration...');
  validateConfiguration(config);

  const { mainCode, extraFiles } = generateApplication(config);

  const outputDir = path.resolve(__dirname, './src');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const slicesRoot = path.resolve(outputDir, 'slices');
  if (fs.existsSync(slicesRoot)) {
    fs.rmSync(slicesRoot, { recursive: true, force: true });
  }

  const outputPath = path.resolve(outputDir, 'GeneratedApp.jsx');
  fs.writeFileSync(outputPath, mainCode);

  extraFiles.forEach(({ path: relativePath, content }) => {
    const targetPath = path.resolve(outputDir, relativePath);
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    fs.writeFileSync(targetPath, content);
  });

  console.log(`✅ Application generated successfully! Output written to ${outputPath}`);
};

main().catch((error) => {
  console.error('❌ Generation failed:', error);
  process.exit(1);
});
