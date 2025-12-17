import fs from 'fs';
import path from 'path';
import readline from 'readline';

export const listConfigurationFiles = (baseDir) => {
  return fs
    .readdirSync(baseDir)
    .filter(file => file.toLowerCase().startsWith('config') && file.endsWith('.json'))
    .map(file => path.resolve(baseDir, file));
};

export const resolveConfigFromEnvOrArgs = (configFiles) => {
  const explicitPath = process.env.EVENTZ_CONFIG ?? process.argv[2];
  if (!explicitPath) {
    return null;
  }

  const absoluteArg = path.isAbsolute(explicitPath)
    ? explicitPath
    : path.resolve(process.cwd(), explicitPath);

  if (configFiles.includes(absoluteArg)) {
    console.log(`🔧 Using configuration from explicit path: ${absoluteArg}`);
    return absoluteArg;
  }

  const numericSelection = Number.parseInt(explicitPath, 10);
  if (!Number.isNaN(numericSelection) && numericSelection >= 1 && numericSelection <= configFiles.length) {
    const selected = configFiles[numericSelection - 1];
    console.log(`🔧 Using configuration from index selection: ${selected}`);
    return selected;
  }

  console.warn(`⚠️ Unable to match provided configuration reference "${explicitPath}". Ignoring.`);
  return null;
};

export const promptForConfigurationSelection = async (configFiles) => {
  if (configFiles.length === 1 || !process.stdin.isTTY) {
    const selected = configFiles[0];
    console.log(`🔧 Using configuration: ${selected}`);
    return selected;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await new Promise((resolve) => {
    rl.question(`Select configuration [1-${configFiles.length}]: `, resolve);
  });

  rl.close();

  const choice = Number.parseInt(answer, 10);
  if (Number.isNaN(choice) || choice < 1 || choice > configFiles.length) {
    console.warn('⚠️ Invalid selection. Defaulting to the first configuration.');
    const selected = configFiles[0];
    console.log(`🔧 Using configuration: ${selected}`);
    return selected;
  }

  const selected = configFiles[choice - 1];
  console.log(`🔧 Using configuration: ${selected}`);
  return selected;
};

export const selectConfigFile = async (baseDir) => {
  const configFiles = listConfigurationFiles(baseDir);

  if (configFiles.length === 0) {
    console.error('❌ No configuration JSON files found. Expect files matching config*.json');
    process.exit(1);
  }

  console.log('\n📁 Available configuration files:');
  configFiles.forEach((file, index) => {
    console.log(`  [${index + 1}] ${file}`);
  });

  const resolved = resolveConfigFromEnvOrArgs(configFiles);
  if (resolved) {
    return resolved;
  }

  return promptForConfigurationSelection(configFiles);
};
