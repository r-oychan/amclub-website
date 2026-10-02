import { cpSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const serverDirectory = path.join(directory, '.next/standalone/next-home');
cpSync(path.join(directory, '.next/static'), path.join(serverDirectory, '.next/static'), { recursive: true });
cpSync(path.join(directory, '../frontend/public'), path.join(serverDirectory, 'public'), { recursive: true });
const server = spawn(process.execPath, [path.join(serverDirectory, 'server.js')], {
  stdio: 'inherit', env: { ...process.env, PORT: process.env.PORT || '3000', HOSTNAME: process.env.HOSTNAME || '127.0.0.1' },
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.kill(signal));
server.on('error', (error) => { console.error(error); process.exitCode = 1; });
server.on('exit', (code) => { process.exitCode = code ?? 0; });
