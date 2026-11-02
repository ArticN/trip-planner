import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// lista dos arquivos do app para o service worker guardar logo na instalação (abrir sem internet
// telas e o mapa que ainda não foram usados). Fica de fora o contorno dos estados de cada país
// (centenas de arquivos pequenos, guardados quando o país aparece).
const precacheList = () => ({
  name: 'precache-list',
  generateBundle(_opts, bundle) {
    const files = Object.keys(bundle)
      .filter((f) => f.startsWith('assets/') && !/^assets\/[A-Z]{2}-[\w-]+\.(js|json)$/.test(f))
      .map((f) => `/${f}`);
    this.emitFile({ type: 'asset', fileName: 'precache.json', source: JSON.stringify(files) });
  },
});

export default defineConfig({
  root: 'web',
  plugins: [react(), precacheList()],
  build: { outDir: '../dist', emptyOutDir: true },
  server: { port: 5173, proxy: { '/api': 'http://localhost:3000' } },
});
