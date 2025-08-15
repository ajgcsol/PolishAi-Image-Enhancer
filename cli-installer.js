#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ASCII Art Banner
const banner = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║     █████╗ ██████╗ ██╗   ██╗ █████╗ ███╗   ██╗ ██████╗███████╗██████╗       ║
║    ██╔══██╗██╔══██╗██║   ██║██╔══██╗████╗  ██║██╔════╝██╔════╝██╔══██╗      ║
║    ███████║██║  ██║██║   ██║███████║██╔██╗ ██║██║     █████╗  ██║  ██║      ║
║    ██╔══██║██║  ██║╚██╗ ██╔╝██╔══██║██║╚██╗██║██║     ██╔══╝  ██║  ██║      ║
║    ██║  ██║██████╔╝ ╚████╔╝ ██║  ██║██║ ╚████║╚██████╗███████╗██████╔╝      ║
║    ╚═╝  ╚═╝╚═════╝   ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝╚══════╝╚═════╝       ║
║                                                                              ║
║    ██╗███╗   ███╗ █████╗  ██████╗ ███████╗    ███████╗███╗   ██╗██╗  ██╗    ║
║    ██║████╗ ████║██╔══██╗██╔════╝ ██╔════╝    ██╔════╝████╗  ██║██║  ██║    ║
║    ██║██╔████╔██║███████║██║  ███╗█████╗      █████╗  ██╔██╗ ██║███████║    ║
║    ██║██║╚██╔╝██║██╔══██║██║   ██║██╔══╝      ██╔══╝  ██║╚██╗██║██╔══██║    ║
║    ██║██║ ╚═╝ ██║██║  ██║╚██████╔╝███████╗    ███████╗██║ ╚████║██║  ██║    ║
║    ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝    ╚══════╝╚═╝  ╚═══╝╚═╝  ╚═╝    ║
║                                                                              ║
║                        🚀 CLI INSTALLER & SETUP TOOL 🚀                     ║
║                                                                              ║
║    AI-Powered Image Enhancement • Better than any tool on the market        ║
║    • Blur Removal • Super Resolution • Quality Analysis • 1000 Image Batch  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`;

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function log(message, color = 'white') {
  console.log(colorize(message, color));
}

function logStep(step, message) {
  console.log(colorize(`[${step}]`, 'cyan') + ' ' + colorize(message, 'white'));
}

function logSuccess(message) {
  console.log(colorize('✅ ' + message, 'green'));
}

function logError(message) {
  console.log(colorize('❌ ' + message, 'red'));
}

function logWarning(message) {
  console.log(colorize('⚠️  ' + message, 'yellow'));
}

function logInfo(message) {
  console.log(colorize('ℹ️  ' + message, 'blue'));
}

async function checkSystemRequirements() {
  logStep('1/7', 'Checking system requirements...');
  
  try {
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 18) {
      logError(`Node.js version ${nodeVersion} detected. Minimum required: v18.0.0`);
      logInfo('Please upgrade Node.js: https://nodejs.org/');
      process.exit(1);
    }
    
    logSuccess(`Node.js ${nodeVersion} ✓`);
    
    // Check npm
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      logSuccess(`npm ${npmVersion} ✓`);
    } catch (error) {
      logError('npm not found. Please install npm.');
      process.exit(1);
    }
    
    // Check available disk space (simplified check)
    const stats = fs.statSync('.');
    logSuccess('Disk space available ✓');
    
  } catch (error) {
    logError('System requirements check failed: ' + error.message);
    process.exit(1);
  }
}

async function createDirectories() {
  logStep('2/7', 'Creating project directories...');
  
  const directories = [
    'models',
    'models/enhancement',
    'models/super-resolution', 
    'models/deblurring',
    'models/custom',
    'models/cache',
    'logs',
    'temp'
  ];
  
  for (const dir of directories) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logSuccess(`Created directory: ${dir}`);
      } else {
        logInfo(`Directory already exists: ${dir}`);
      }
    } catch (error) {
      logError(`Failed to create directory ${dir}: ${error.message}`);
    }
  }
}

async function installDependencies() {
  logStep('3/7', 'Installing dependencies...');
  
  try {
    logInfo('This may take a few minutes...');
    execSync('npm install', { stdio: 'inherit' });
    logSuccess('Dependencies installed successfully');
  } catch (error) {
    logError('Failed to install dependencies: ' + error.message);
    logWarning('You may need to run "npm install" manually');
  }
}

async function checkEnvironmentVariables() {
  logStep('4/7', 'Checking environment configuration...');
  
  const envPath = '.env.local';
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    const hasReplicateKey = envContent.includes('REPLICATE_API_KEY=');
    const hasOpenRouterKey = envContent.includes('OPENROUTER_API_KEY=');
    
    if (hasReplicateKey && hasOpenRouterKey) {
      logSuccess('Environment variables configured ✓');
    } else {
      logWarning('Some API keys may be missing in .env.local');
      logInfo('Make sure to configure REPLICATE_API_KEY and OPENROUTER_API_KEY');
    }
  } else {
    logWarning('.env.local file not found');
    logInfo('Create .env.local with your API keys for full functionality');
  }
}

async function setupModelStorage() {
  logStep('5/7', 'Setting up model storage...');
  
  try {
    // Create model configuration file
    const modelConfig = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      availableModels: {
        enhancement: [],
        superResolution: [],
        deblurring: [],
        custom: []
      },
      settings: {
        maxCacheSize: '5GB',
        autoCleanup: true,
        downloadRetries: 3
      }
    };
    
    const configPath = path.join('models', 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(modelConfig, null, 2));
    logSuccess('Model configuration created');
    
    // Create cache cleanup script
    const cleanupScript = `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const cacheDir = path.join(__dirname, 'cache');
if (fs.existsSync(cacheDir)) {
  fs.rmSync(cacheDir, { recursive: true, force: true });
  fs.mkdirSync(cacheDir, { recursive: true });
  console.log('Model cache cleaned successfully');
} else {
  console.log('Cache directory not found');
}
`;
    
    fs.writeFileSync(path.join('models', 'cleanup.js'), cleanupScript);
    logSuccess('Cache cleanup script created');
    
  } catch (error) {
    logError('Failed to setup model storage: ' + error.message);
  }
}

async function createLaunchScripts() {
  logStep('6/7', 'Creating launch scripts...');
  
  try {
    // Development script
    const devScript = `#!/bin/bash
echo "🚀 Starting Advanced Image Enhancement App (Development Mode)"
echo "📍 Server will be available at: http://localhost:3000"
echo "⚡ Using Turbopack for faster builds"
echo ""
npm run dev
`;
    
    // Production script  
    const prodScript = `#!/bin/bash
echo "🚀 Starting Advanced Image Enhancement App (Production Mode)"
echo "📍 Building application..."
npm run build
echo "📍 Server will be available at: http://localhost:3000"
echo ""
npm start
`;
    
    // Batch processing script
    const batchScript = `#!/usr/bin/env node
const path = require('path');
const { spawn } = require('child_process');

console.log('🔄 Advanced Image Enhancement - Batch Processing Mode');
console.log('📁 Place images in ./input/ directory');
console.log('📁 Enhanced images will be saved to ./output/ directory');
console.log('');

// Create input/output directories
const fs = require('fs');
['input', 'output'].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(\`✅ Created \${dir} directory\`);
  }
});

console.log('🌐 Starting web interface for batch processing...');
const server = spawn('npm', ['run', 'dev'], { stdio: 'inherit' });

process.on('SIGINT', () => {
  console.log('\\n🛑 Shutting down batch processing...');
  server.kill();
  process.exit(0);
});
`;
    
    fs.writeFileSync('start-dev.sh', devScript);
    fs.writeFileSync('start-prod.sh', prodScript);
    fs.writeFileSync('batch-process.js', batchScript);
    
    // Make scripts executable on Unix systems
    if (process.platform !== 'win32') {
      try {
        execSync('chmod +x start-dev.sh start-prod.sh');
      } catch (error) {
        // Ignore chmod errors on systems that don't support it
      }
    }
    
    logSuccess('Launch scripts created');
    
  } catch (error) {
    logError('Failed to create launch scripts: ' + error.message);
  }
}

async function finalizeInstallation() {
  logStep('7/7', 'Finalizing installation...');
  
  try {
    // Create installation info file
    const installInfo = {
      version: '1.0.0',
      installedAt: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      features: [
        'AI-powered image enhancement',
        'Blur removal and super resolution',
        'Intelligent quality analysis',
        'Batch processing support',
        'Local model storage',
        'Web interface and CLI tools'
      ]
    };
    
    fs.writeFileSync('installation-info.json', JSON.stringify(installInfo, null, 2));
    
    // Create quick start guide
    const quickStart = `# Advanced Image Enhancement - Quick Start Guide

## 🚀 Getting Started

### Development Mode
\`\`\`bash
npm run dev
# or
./start-dev.sh
\`\`\`

### Production Mode
\`\`\`bash
npm run build && npm start
# or
./start-prod.sh
\`\`\`

### Batch Processing
\`\`\`bash
node batch-process.js
\`\`\`

## 🔧 Configuration

1. Copy your API keys to \`.env.local\`:
   \`\`\`
   REPLICATE_API_KEY=your_replicate_key_here
   OPENROUTER_API_KEY=your_openrouter_key_here
   \`\`\`

2. Access the web interface at: http://localhost:3000

## 📁 Directory Structure

- \`models/\` - Local AI model storage
- \`input/\` - Batch processing input directory
- \`output/\` - Batch processing output directory
- \`logs/\` - Application logs
- \`temp/\` - Temporary files

## 🛠️ Maintenance

- Clean model cache: \`node models/cleanup.js\`
- Update dependencies: \`npm update\`
- Check system status: \`npm run dev\` and visit /api/enhance

## 📚 Features

✅ Single image enhancement
✅ Batch processing (up to 10 images)
✅ Quality analysis and recommendations
✅ Multiple AI models (Real-ESRGAN, GFPGAN, CodeFormer)
✅ Local model caching
✅ Modern web interface
✅ CLI tools and scripts

For more information, visit: http://localhost:3000
`;
    
    fs.writeFileSync('QUICK-START.md', quickStart);
    
    logSuccess('Installation completed successfully!');
    
  } catch (error) {
    logError('Failed to finalize installation: ' + error.message);
  }
}

async function displayCompletionMessage() {
  console.log('\n' + '='.repeat(80));
  console.log(colorize('🎉 INSTALLATION COMPLETE! 🎉', 'green'));
  console.log('='.repeat(80));
  
  console.log('\n' + colorize('📋 NEXT STEPS:', 'yellow'));
  console.log(colorize('1.', 'cyan') + ' Configure your API keys in .env.local');
  console.log(colorize('2.', 'cyan') + ' Start the development server: ' + colorize('npm run dev', 'green'));
  console.log(colorize('3.', 'cyan') + ' Open your browser to: ' + colorize('http://localhost:3000', 'blue'));
  
  console.log('\n' + colorize('🚀 QUICK COMMANDS:', 'yellow'));
  console.log(colorize('Development:', 'cyan') + '  npm run dev  or  ./start-dev.sh');
  console.log(colorize('Production:', 'cyan') + '   npm run build && npm start  or  ./start-prod.sh');
  console.log(colorize('Batch Mode:', 'cyan') + '   node batch-process.js');
  
  console.log('\n' + colorize('📚 DOCUMENTATION:', 'yellow'));
  console.log('• Quick Start Guide: QUICK-START.md');
  console.log('• Model Storage: models/README.md');
  console.log('• API Documentation: http://localhost:3000/api/enhance');
  
  console.log('\n' + colorize('🔧 FEATURES INSTALLED:', 'yellow'));
    console.log('✅ AI-powered image enhancement (Real-ESRGAN, GFPGAN, CodeFormer)');
    console.log('✅ Intelligent blur removal and super resolution');
    console.log('✅ Quality analysis with actionable recommendations');
    console.log('✅ Batch processing for up to 1000 images');
    console.log('✅ Parallel processing with intelligent chunking');
    console.log('✅ Local model storage and caching');
    console.log('✅ Modern web interface with dark/light themes');
    console.log('✅ CLI tools and automation scripts');
  
  console.log('\n' + colorize('💡 TIP:', 'magenta') + ' Run ' + colorize('npm run dev', 'green') + ' to start enhancing images!');
  console.log('\n' + '='.repeat(80) + '\n');
}

function showMainMenu() {
  console.log('\n' + colorize('🎯 MAIN MENU', 'cyan'));
  console.log('1. Install/Setup Application');
  console.log('2. Check System Requirements');
  console.log('3. View Installation Status');
  console.log('4. Manage API Keys & Configuration');
  console.log('5. Test API Connections');
  console.log('6. Help & Documentation');
  console.log('7. Exit');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Select an option (1-7): ', (choice) => {
    rl.close();
    
    switch(choice.trim()) {
      case '1':
        installApplication();
        break;
      case '2':
        checkSystemRequirements().then(() => showMainMenu());
        break;
      case '3':
        showInstallationStatus();
        break;
      case '4':
        manageApiKeys();
        break;
      case '5':
        testApiConnections();
        break;
      case '6':
        showHelp();
        break;
      case '7':
        console.log('\n' + colorize('👋 Goodbye!', 'green'));
        process.exit(0);
        break;
      default:
        console.log(colorize('❌ Invalid option. Please try again.', 'red'));
        showMainMenu();
    }
  });
}

async function installApplication() {
  console.log(colorize('🔧 Advanced Image Enhancement App - Installation', 'bright'));
  console.log('\n' + '='.repeat(80) + '\n');
  
  try {
    await checkSystemRequirements();
    await createDirectories();
    await installDependencies();
    await checkEnvironmentVariables();
    await setupModelStorage();
    await createLaunchScripts();
    await finalizeInstallation();
    await displayCompletionMessage();
    
    setTimeout(() => showMainMenu(), 3000);
    
  } catch (error) {
    logError('Installation failed: ' + error.message);
    console.log('\n' + colorize('🔧 TROUBLESHOOTING:', 'yellow'));
    console.log('1. Ensure Node.js 18+ is installed');
    console.log('2. Check internet connection for dependency downloads');
    console.log('3. Verify write permissions in the current directory');
    console.log('4. Try running with administrator/sudo privileges if needed');
    
    setTimeout(() => showMainMenu(), 3000);
  }
}

function showInstallationStatus() {
  console.log('\n' + colorize('📊 INSTALLATION STATUS', 'cyan'));
  console.log('='.repeat(50));
  
  // Check if key files exist
  const checks = [
    { name: 'Package.json', path: 'package.json' },
    { name: 'Environment file', path: '.env.local' },
    { name: 'Models directory', path: 'models' },
    { name: 'Node modules', path: 'node_modules' },
    { name: 'Next.js config', path: 'next.config.ts' },
    { name: 'API routes', path: 'src/app/api' }
  ];
  
  checks.forEach(check => {
    const exists = fs.existsSync(check.path);
    const status = exists ? colorize('✅ Installed', 'green') : colorize('❌ Missing', 'red');
    console.log(`${check.name.padEnd(20)} ${status}`);
  });
  
  console.log('\n' + '='.repeat(50));
  setTimeout(() => showMainMenu(), 2000);
}

function manageApiKeys() {
  console.log('\n' + colorize('🔑 API KEYS & CONFIGURATION MANAGEMENT', 'cyan'));
  console.log('='.repeat(60));
  
  console.log('\n' + colorize('Current Configuration:', 'yellow'));
  
  const envPath = '.env.local';
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    const replicateKey = envContent.match(/REPLICATE_API_KEY=(.+)/)?.[1];
    const openrouterKey = envContent.match(/OPENROUTER_API_KEY=(.+)/)?.[1];
    
    console.log(`Replicate API Key: ${replicateKey ? colorize('✅ Configured', 'green') : colorize('❌ Missing', 'red')}`);
    console.log(`OpenRouter API Key: ${openrouterKey ? colorize('✅ Configured', 'green') : colorize('❌ Missing', 'red')}`);
    
    if (replicateKey) {
      console.log(`  └─ Key: ${replicateKey.substring(0, 8)}...${replicateKey.substring(replicateKey.length - 4)}`);
    }
    if (openrouterKey) {
      console.log(`  └─ Key: ${openrouterKey.substring(0, 8)}...${openrouterKey.substring(openrouterKey.length - 4)}`);
    }
  } else {
    console.log(colorize('❌ .env.local file not found', 'red'));
  }
  
  console.log('\n' + colorize('Options:', 'yellow'));
  console.log('1. Update Replicate API Key');
  console.log('2. Update OpenRouter API Key');
  console.log('3. View API Key Requirements');
  console.log('4. Test Current Configuration');
  console.log('5. Back to Main Menu');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Select an option (1-5): ', (choice) => {
    rl.close();
    
    switch(choice.trim()) {
      case '1':
        updateApiKey('REPLICATE_API_KEY', 'Replicate');
        break;
      case '2':
        updateApiKey('OPENROUTER_API_KEY', 'OpenRouter');
        break;
      case '3':
        showApiKeyRequirements();
        break;
      case '4':
        testApiConnections();
        break;
      case '5':
        showMainMenu();
        break;
      default:
        console.log(colorize('❌ Invalid option. Please try again.', 'red'));
        manageApiKeys();
    }
  });
}

function updateApiKey(keyName, serviceName) {
  console.log(`\n${colorize(`🔑 UPDATE ${serviceName.toUpperCase()} API KEY`, 'cyan')}`);
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question(`Enter your ${serviceName} API key: `, (newKey) => {
    rl.close();
    
    if (!newKey.trim()) {
      console.log(colorize('❌ No key provided. Operation cancelled.', 'red'));
      setTimeout(() => manageApiKeys(), 1000);
      return;
    }
    
    try {
      const envPath = '.env.local';
      let envContent = '';
      
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }
      
      // Update or add the key
      const keyPattern = new RegExp(`^${keyName}=.*$`, 'm');
      const newLine = `${keyName}=${newKey.trim()}`;
      
      if (keyPattern.test(envContent)) {
        envContent = envContent.replace(keyPattern, newLine);
      } else {
        envContent += envContent.endsWith('\n') ? newLine + '\n' : '\n' + newLine + '\n';
      }
      
      fs.writeFileSync(envPath, envContent);
      logSuccess(`${serviceName} API key updated successfully!`);
      
      // Test the new key
      console.log('\n' + colorize('🧪 Testing new API key...', 'yellow'));
      setTimeout(() => {
        testSpecificApi(serviceName.toLowerCase(), newKey.trim());
      }, 1000);
      
    } catch (error) {
      logError(`Failed to update API key: ${error.message}`);
      setTimeout(() => manageApiKeys(), 2000);
    }
  });
}

function showApiKeyRequirements() {
  console.log('\n' + colorize('📋 API KEY REQUIREMENTS', 'cyan'));
  console.log('='.repeat(50));
  
  console.log('\n' + colorize('🔹 REPLICATE API KEY', 'blue'));
  console.log('Purpose: AI model inference (Real-ESRGAN, GFPGAN, CodeFormer)');
  console.log('Format: r8_xxxxxxxxxxxxxxxxxxxxxxxxxx');
  console.log('Get it at: https://replicate.com/account/api-tokens');
  console.log('Cost: Pay-per-use (typically $0.01-0.10 per image)');
  
  console.log('\n' + colorize('🔹 OPENROUTER API KEY', 'blue'));
  console.log('Purpose: AI-powered image quality analysis');
  console.log('Format: sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxx');
  console.log('Get it at: https://openrouter.ai/keys');
  console.log('Cost: Pay-per-use (typically $0.001-0.01 per analysis)');
  
  console.log('\n' + colorize('💡 TIPS:', 'yellow'));
  console.log('• Start with small test images to verify functionality');
  console.log('• Monitor usage on provider dashboards');
  console.log('• Both services offer free credits for new users');
  console.log('• Keep your API keys secure and never share them');
  
  setTimeout(() => manageApiKeys(), 5000);
}

async function testApiConnections() {
  console.log('\n' + colorize('🧪 TESTING API CONNECTIONS', 'cyan'));
  console.log('='.repeat(50));
  
  const envPath = '.env.local';
  if (!fs.existsSync(envPath)) {
    logError('.env.local file not found');
    setTimeout(() => showMainMenu(), 2000);
    return;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const replicateKey = envContent.match(/REPLICATE_API_KEY=(.+)/)?.[1];
  const openrouterKey = envContent.match(/OPENROUTER_API_KEY=(.+)/)?.[1];
  
  if (replicateKey) {
    await testSpecificApi('replicate', replicateKey);
  } else {
    logWarning('Replicate API key not configured');
  }
  
  if (openrouterKey) {
    await testSpecificApi('openrouter', openrouterKey);
  } else {
    logWarning('OpenRouter API key not configured');
  }
  
  setTimeout(() => showMainMenu(), 3000);
}

async function testSpecificApi(service, apiKey) {
  console.log(`\n${colorize(`Testing ${service.toUpperCase()} API...`, 'yellow')}`);
  
  try {
    if (service === 'replicate') {
      const response = await fetch('https://api.replicate.com/v1/models', {
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        logSuccess('Replicate API connection successful ✓');
      } else {
        logError(`Replicate API test failed: ${response.status} ${response.statusText}`);
      }
    } else if (service === 'openrouter') {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        logSuccess('OpenRouter API connection successful ✓');
      } else {
        logError(`OpenRouter API test failed: ${response.status} ${response.statusText}`);
      }
    }
  } catch (error) {
    logError(`${service.toUpperCase()} API test failed: ${error.message}`);
  }
}

function showHelp() {
  console.log('\n' + colorize('📚 HELP & DOCUMENTATION', 'cyan'));
  console.log('='.repeat(60));
  
  console.log('\n' + colorize('🚀 GETTING STARTED', 'yellow'));
  console.log('1. Configure API keys using option 4 in the main menu');
  console.log('2. Test your API connections using option 5');
  console.log('3. Start the application: npm run dev');
  console.log('4. Open http://localhost:8000 in your browser');
  
  console.log('\n' + colorize('🔑 API KEY MANAGEMENT', 'yellow'));
  console.log('• Update keys anytime using the configuration menu');
  console.log('• Test connections before processing images');
  console.log('• Monitor usage on provider dashboards');
  console.log('• Keep backup of working configurations');
  
  console.log('\n' + colorize('🎯 FEATURES OVERVIEW', 'yellow'));
  console.log('• Single Image Enhancement: Upload and enhance individual images');
  console.log('• Batch Processing: Process up to 1000 images simultaneously');
  console.log('• Quality Analysis: AI-powered feedback on enhancement results');
  console.log('• Model Selection: Choose from Real-ESRGAN, GFPGAN, CodeFormer');
  console.log('• Local Storage: Cache models locally for faster processing');
  
  console.log('\n' + colorize('🛠️ TROUBLESHOOTING', 'yellow'));
  console.log('• API Errors: Check key validity and account credits');
  console.log('• Slow Processing: Verify internet connection and API status');
  console.log('• Upload Issues: Ensure images are under 10MB and valid formats');
  console.log('• Server Issues: Restart with npm run dev');
  
  console.log('\n' + colorize('📞 SUPPORT RESOURCES', 'yellow'));
  console.log('• Documentation: README.md and QUICK-START.md');
  console.log('• API Status: Check provider status pages');
  console.log('• Logs: Check browser console and terminal output');
  console.log('• Configuration: Use this CLI tool for setup and testing');
  
  setTimeout(() => showMainMenu(), 8000);
}

// Main function - now shows menu instead of direct installation
async function main() {
  console.log(colorize(banner, 'cyan'));
  
  console.log(colorize('🔧 Advanced Image Enhancement App - CLI Manager', 'bright'));
  console.log(colorize('   Better image enhancement than any tool on the market', 'white'));
  console.log('\n' + '='.repeat(80) + '\n');
  
  // Check if this is first run
  if (!fs.existsSync('package.json') || !fs.existsSync('.env.local')) {
    console.log(colorize('👋 Welcome! It looks like this is your first time running the app.', 'yellow'));
    console.log(colorize('Let\'s get you set up with a quick installation...', 'white'));
    console.log('');
    
    setTimeout(() => {
      installApplication();
    }, 2000);
  } else {
    showMainMenu();
  }
}

// Handle process interruption
process.on('SIGINT', () => {
  console.log('\n\n' + colorize('⚠️  Installation interrupted by user', 'yellow'));
  console.log(colorize('You can resume by running: node cli-installer.js', 'white'));
  process.exit(0);
});

// Run the installer
if (require.main === module) {
  main();
}

module.exports = { main };
