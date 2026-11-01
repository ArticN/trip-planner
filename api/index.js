// Vercel: a API inteira roda como uma função; o front-end é servido do build estático (dist).
// Se o servidor nem consegue carregar (ex.: variável faltando), responde o motivo em vez de cair.
let app;
let loadError;
try {
  ({ app } = await import('../server/app.js'));
} catch (e) {
  loadError = e;
  console.error('falha ao iniciar a API:', e);
}

export default function handler(req, res) {
  if (app) return app(req, res);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  // a tela de configuração do front-end lê /api/setup para explicar o que falta
  if (req.url?.startsWith('/api/setup')) {
    const detail = String(loadError?.message || '');
    res.setHeader('Cache-Control', 'no-store');
    return res.end(JSON.stringify({ db: /TURSO_DATABASE_URL/.test(detail) ? 'missing' : 'error', detail, password: !!process.env.APP_PASSWORD, hosted: true }));
  }
  res.statusCode = 500;
  res.end(JSON.stringify({ error: `a API não iniciou: ${loadError?.message}` }));
}
