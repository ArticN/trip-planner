import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// lista dos arquivos do app para o service worker guardar logo na instalação (abrir sem internet
// telas e o mapa que ainda não foram usados). Fica de fora o contorno dos estados de cada país
// (centenas de arquivos pequenos, guardados quando o país aparece).
// assets.json tem TODOS os arquivos desta versão: o service worker apaga do aparelho os das versões antigas.
// O sw.js recebe uma marca da versão, para o navegador instalar o service worker de novo a cada build
// (sem isso ele só reinstala quando o próprio sw.js muda, e a lista nova nunca seria baixada).
let buildId = 'dev';
const precacheList = () => ({
  name: 'precache-list',
  // depois dos plugins do Vite: antes disso o pacote ainda tem um pedaço do MapLibre que não chega ao disco
  // (a lista pedia um arquivo inexistente e o service worker tentava baixá-lo a cada instalação)
  enforce: 'post',
  generateBundle(_opts, bundle) {
    const all = Object.keys(bundle).filter((f) => f.startsWith('assets/')).map((f) => `/${f}`).sort();
    const files = all.filter((f) => !/^\/assets\/[A-Z]{2}-[\w-]+\.(js|json)$/.test(f));
    buildId = createHash('sha256').update(all.join('\n')).digest('hex').slice(0, 12);
    this.emitFile({ type: 'asset', fileName: 'precache.json', source: JSON.stringify(files) });
    this.emitFile({ type: 'asset', fileName: 'assets.json', source: JSON.stringify(all) });
  },
  writeBundle(opts) {
    const sw = path.join(opts.dir, 'sw.js');
    if (fs.existsSync(sw)) fs.writeFileSync(sw, fs.readFileSync(sw, 'utf8').replace("const BUILD = 'dev';", `const BUILD = '${buildId}';`));
  },
});

export default defineConfig({
  root: 'web',
  plugins: [react(), precacheList()],
  build: { outDir: '../dist', emptyOutDir: true },
  server: { port: 5173, proxy: { '/api': 'http://localhost:3000' } },
});
