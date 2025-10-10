// scripts/dev.js
import kill from 'kill-port';
import { exec } from 'child_process';

const ports = [3000, 3030];

(async () => {
  for (const port of ports) {
    try {
      await kill(port);
      console.log(`✅ Killed process on port ${port}`);
    } catch {
      console.log(`⚪ No process found on port ${port}`);
    }
  }

  // Run your dev servers concurrently
  const command = 'npx concurrently "next dev" "cd designtokens && PORT=3030 node server.js"';
  console.log('🚀 Starting dev servers...');
  exec(command, { stdio: 'inherit', shell: true });
})();