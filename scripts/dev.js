import kill from 'kill-port';
import { spawn } from 'child_process';
import readline from 'readline';
import dotenv from 'dotenv';
import path from 'path';

const ports = [3000, 3030];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askEnvironment = () => {
  return new Promise((resolve) => {
    rl.question('Select environment (master, platform, creator): ', (answer) => {
      const env = answer.trim().toLowerCase();
      if (['master', 'platform', 'creator'].includes(env)) {
        resolve(env);
      } else {
        console.log('Invalid environment. Please enter one of: master, platform, creator.');
        resolve(askEnvironment());
      }
    });
  });
};

(async () => {
  const env = await askEnvironment();
  rl.close();

  // Load environment variables from the selected .env file
  const envPath = path.resolve(process.cwd(), `.env.${env}`);
  dotenv.config({ path: envPath });

  for (const port of ports) {
    try {
      await kill(port);
      console.log(`✅ Killed process on port ${port}`);
    } catch {
      console.log(`⚪ No process found on port ${port}`);
    }
  }

  console.log('🚀 Starting dev servers...');

  // Start Next.js
  const nextServer = spawn('npx', ['next', 'dev'], { shell: true });

  nextServer.stdout.on('data', (data) => {
    process.stdout.write(`[Next.js] ${data}`);
  });

  nextServer.stderr.on('data', (data) => {
    process.stderr.write(`[Next.js] ${data}`);
  });

  // Start design tokens server
  const tokensServer = spawn('node', ['server.js'], {
    cwd: './designtokens',
    env: { ...process.env, PORT: '3030' },
    shell: true,
  });

  tokensServer.stdout.on('data', (data) => {
    process.stdout.write(`[Tokens] ${data}`);
  });

  tokensServer.stderr.on('data', (data) => {
    process.stderr.write(`[Tokens] ${data}`);
  });

  // Handle exits
  const handleExit = () => {
    nextServer.kill();
    tokensServer.kill();
    process.exit();
  };

  process.on('SIGINT', handleExit);
  process.on('SIGTERM', handleExit);
})();