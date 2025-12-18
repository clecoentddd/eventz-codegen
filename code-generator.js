
// ============================================================================
// EVENTZ CODE GENERATOR
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
  
  const { code: judgeCode, modules: judgeModules, imports: judgeImports } = generateJudgeRules(slices);
  extraFiles.push(...judgeModules);

  const reactUI = generateReactUI(slices, config, { projectionImports, commandImports });
  const automation = generateAutomation(slices, { automationImports });

  const importBlocks = [reactUI.imports, automation.imports, ...judgeImports].filter(Boolean).join('\n');
  code += importBlocks ? `\n${importBlocks}` : '\n';

  code += `// Generated from EventZ configuration: ${config.context}\n\n`;

  code += judgeCode;
  code += automation.code;
  code += reactUI.code;

  return { mainCode: code, extraFiles };
}

// ============================================================================
// SCRIPT EXECUTION
// ============================================================================

const main = async () => {
  try {
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
    fs.mkdirSync(slicesRoot, { recursive: true });

    const outputPath = path.resolve(outputDir, 'GeneratedApp.jsx');
    fs.writeFileSync(outputPath, mainCode);
    console.log(`✅ Application generated: ${outputPath}`);

    extraFiles.forEach(({ path: relativePath, content }) => {
      const targetPath = path.resolve(outputDir, relativePath);
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      fs.writeFileSync(targetPath, content);
      console.log(`  - Wrote additional file: ${targetPath}`);
    });

    console.log('\n🎉 Generation complete!');

  } catch (error) {
    console.error('\n❌ Generation failed:', error.message);
    // console.error(error.stack);
    process.exit(1);
  }
};

main();
