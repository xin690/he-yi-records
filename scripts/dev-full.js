const { spawn } = require('child_process');
const http = require('http');

console.log('Waiting for Vite server...');

let attempts = 0;
const maxAttempts = 30;

function checkServer() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5173', (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000);
  });
}

async function waitAndRun() {
  while (attempts < maxAttempts) {
    const ready = await checkServer();
    if (ready) {
      console.log('Vite server ready!');
      
      // Build Electron and run
      const electron = spawn('npx', ['tsc', '-p', 'electron/tsconfig.json'], {
        stdio: 'inherit',
        shell: true,
        cwd: process.cwd()
      });
      
      electron.on('close', (code) => {
        if (code === 0) {
          const runElectron = spawn('npx', ['cross-env', 'NODE_ENV=development', 'electron', '.'], {
            stdio: 'inherit',
            shell: true,
            cwd: process.cwd()
          });
        }
      });
      
      return;
    }
    attempts++;
    await new Promise(r => setTimeout(r, 500));
  }
  console.error('Vite server not ready');
  process.exit(1);
}

waitAndRun();