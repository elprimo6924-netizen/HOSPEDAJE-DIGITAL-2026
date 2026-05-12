const { spawn, spawnSync } = require('child_process');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const backendRoot = path.join(projectRoot, 'BACKEND');
const backendEntry = path.join(projectRoot, 'BACKEND', 'index.js');
const frontendEntry = path.join(projectRoot, 'serve-frontend.js');
const stopPortScript = path.join(backendRoot, 'scripts', 'stop-port.js');

const children = [];

function startProcess(name, scriptPath, cwd) {
  const child = spawn(process.execPath, [scriptPath], {
    cwd,
    stdio: 'inherit',
  });

  child.on('exit', (code, signal) => {
    if (signal || code !== 0) {
      console.error(`\n${name} terminó con ${signal || `código ${code}`}.`);
      shutdown();
      process.exit(code || 1);
    }
  });

  children.push(child);
  return child;
}

function shutdown() {
  while (children.length) {
    const child = children.pop();
    if (child && !child.killed) {
      child.kill();
    }
  }
}

spawnSync(process.execPath, [stopPortScript, '3000'], {
  cwd: backendRoot,
  stdio: 'inherit',
});

process.on('SIGINT', () => {
  shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  shutdown();
  process.exit(0);
});

startProcess('Backend', backendEntry, backendRoot);
startProcess('Frontend', frontendEntry, projectRoot);
