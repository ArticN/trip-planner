// Sobe a API (porta 3000) e o Vite (5173) juntos; funciona no Windows, Mac e Linux.
import { spawn } from 'node:child_process';

const run = (args) => spawn(process.execPath, args, { stdio: 'inherit' });
const procs = [run(['--watch', 'server/index.js']), run(['node_modules/vite/bin/vite.js'])];
const stop = () => { procs.forEach((p) => p.kill()); process.exit(); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
procs.forEach((p) => p.on('exit', (code) => { if (code) stop(); }));
