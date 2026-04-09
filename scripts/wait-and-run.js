const http = require('http');

const maxAttempts = 30;
const delay = 500;

async function waitForServer(url, maxAttempts, delay) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          resolve(true);
        });
        req.on('error', reject);
        req.setTimeout(1000);
      });
      console.log('Server is ready!');
      return true;
    } catch (e) {
      await new Promise(r => setTimeout(r, delay));
    }
  }
  return false;
}

const ready = waitForServer('http://localhost:5173', maxAttempts, delay);
if (ready) {
  const { spawn } = require('child_process');
  const electron = spawn('npx', ['cross-env', 'NODE_ENV=development', 'electron', '.'], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
  });
} else {
  console.error('Server not ready');
  process.exit(1);
}