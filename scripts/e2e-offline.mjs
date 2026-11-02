// Teste de ponta a ponta do modo offline, no navegador de verdade (Playwright + Chromium), com o app compilado:
//   npm run build && node scripts/e2e-offline.mjs
// Sobe o servidor num banco temporário, abre uma viagem, DERRUBA o servidor (como ficar sem internet),
// recarrega o app, marca uma atividade como feita, recarrega de novo (a edição continua lá), religa o
// servidor e confere que a edição chegou ao banco sozinha.
// Obs.: o modo offline do Playwright (setOffline) não afeta o service worker; por isso o servidor é derrubado.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

// Playwright não é dependência do app: instale à parte (npm i --no-save playwright && npx playwright install chromium)
let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch { console.error('Playwright não encontrado: npm i --no-save playwright && npx playwright install chromium'); process.exit(1); }

const PORT = 4317;
const BASE = `http://localhost:${PORT}`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-e2e-'));
const env = { ...process.env, PORT: String(PORT), DB_PATH: path.join(dir, 'e2e.db'), APP_PASSWORD: '' };
delete env.TURSO_DATABASE_URL;

let srv;
const start = async () => {
  srv = spawn(process.execPath, ['server/index.js'], { env, stdio: ['ignore', 'pipe', 'inherit'] });
  for (let i = 0; i < 50; i++) { try { if ((await fetch(`${BASE}/api/session`)).ok) return; } catch { /* subindo */ } await new Promise((r) => setTimeout(r, 200)); }
  throw new Error('servidor não subiu');
};
const stop = () => new Promise((r) => { srv.once('exit', r); srv.kill(); });
const step = (m) => console.log(`• ${m}`);
const fail = (m) => { throw new Error(m); };

if (!fs.existsSync('dist/index.html')) fail('rode npm run build antes');
await start();
const browser = await chromium.launch();
try {
  const made = await (await fetch(`${BASE}/api/examples/exemplo`, { method: 'POST' })).json();
  const tripId = made.trip.id;
  const trip = await (await fetch(`${BASE}/api/trips/${tripId}`)).json();
  const day = trip.activities.find((a) => a.kind !== 'flight')?.day;
  step(`viagem de exemplo ${tripId}, dia ${day}`);

  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('  erro na página:', e.message));
  await page.goto(BASE);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  step('service worker ativo');
  await page.waitForTimeout(4000); // a Home guarda todas as viagens no aparelho
  await page.goto(`${BASE}/#/t/${tripId}/${day}`);
  await page.waitForSelector('button.check');
  const before = await page.locator('button.check').first().getAttribute('class');
  if (before.includes(' on')) fail('a primeira atividade já estava feita');

  await stop();
  step('servidor derrubado (sem internet)');
  await page.reload();
  await page.waitForSelector('button.check', { timeout: 20000 });
  step('app abriu sem servidor, com a cópia do aparelho');
  await page.locator('button.check').first().click();
  await page.waitForSelector('button.check.on');
  await page.waitForSelector('.offline-bar', { timeout: 10000 });
  step(`barra: "${(await page.locator('.offline-bar').innerText()).trim()}"`);
  const SHOTS = process.env.SHOTS; // pasta para salvar capturas de tela (opcional)
  if (SHOTS) {
    await page.locator('.offline-bar').click();
    await page.waitForSelector('text=Esperando internet');
    await page.screenshot({ path: path.join(SHOTS, 'offline-painel.png') });
    await page.keyboard.press('Escape');
  }

  await page.reload();
  await page.waitForSelector('button.check', { timeout: 20000 });
  if (!(await page.locator('button.check').first().getAttribute('class')).includes(' on')) fail('a edição feita sem internet sumiu ao recarregar');
  step('edição continua lá depois de recarregar sem servidor');

  // aba sem rede: a barra diz "Sem internet"
  await ctx.setOffline(true);
  await page.waitForFunction(() => /Sem internet/.test(document.querySelector('.offline-bar')?.textContent || ''), null, { timeout: 5000 });
  step('com o aparelho offline a barra mostra "Sem internet"');
  await ctx.setOffline(false);

  await start();
  step('servidor de volta');
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  let done = false;
  for (let i = 0; i < 40 && !done; i++) {
    await page.waitForTimeout(500);
    const t = await (await fetch(`${BASE}/api/trips/${tripId}`)).json();
    done = t.activities.filter((a) => a.day === day).sort((a, b) => a.sort - b.sort).some((a) => a.done);
  }
  if (!done) fail('a edição não chegou ao servidor');
  await page.waitForFunction(() => !document.querySelector('.offline-bar'), null, { timeout: 15000 });
  step('edição sincronizada e barra sumiu');

  // painel "Dados no aparelho" com backup automático
  await page.evaluate(() => window.dispatchEvent(new Event('open-offline-panel')));
  await page.waitForSelector('text=Backups automáticos');
  if (!(await page.locator('.offp-bk').count())) fail('nenhum backup automático no painel');
  step('painel mostra os backups automáticos');
  console.log('\nOK: modo offline funcionando de ponta a ponta');
} finally {
  await browser.close();
  if (srv.exitCode == null) await stop();
  fs.rmSync(dir, { recursive: true, force: true });
}
