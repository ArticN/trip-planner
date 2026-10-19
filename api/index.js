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
  res.statusCode = 500;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ error: `a API não iniciou: ${loadError?.message}` }));
}
