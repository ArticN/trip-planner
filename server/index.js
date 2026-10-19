import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { app, ready } from './app.js';

// servidor local (no computador): API + front-end compilado
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 3000);

const DIST = path.join(ROOT, 'dist');
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get('*', (_req, res) => res.sendFile(path.join(DIST, 'index.html')));
} else {
  app.get('/', (_req, res) => res.send('Front-end não compilado. Rode: npm run build (ou npm run dev:web).'));
}

await ready;
app.listen(PORT, () => console.log(`Trip Planner rodando em http://localhost:${PORT}`));
