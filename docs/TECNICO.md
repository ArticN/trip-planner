# Detalhes técnicos

## Variáveis de ambiente

| Variável | Onde | Para quê |
| --- | --- | --- |
| `TURSO_DATABASE_URL` | Vercel (obrigatória) | URL do banco Turso (`libsql://….turso.io`). Sem ela, o app usa um arquivo local. |
| `TURSO_AUTH_TOKEN` | Vercel (obrigatória) | Token de acesso ao banco Turso. |
| `APP_PASSWORD` | Vercel (recomendada) e local (opcional) | Senha para entrar no app. Sem ela, qualquer pessoa com o link vê e edita tudo. |
| `DB_PATH` | local | Caminho do arquivo SQLite (padrão `data/planner.db`). |
| `PORT` | local | Porta da API (padrão 3000). |

As tabelas são criadas e migradas sozinhas no primeiro acesso, tanto no arquivo local quanto no Turso.

## Scripts

```bash
npm run dev      # API em :3000 + Vite com hot reload em http://localhost:5173
npm run build    # gera o front-end em dist/
npm start        # serve o build e a API em http://localhost:3000
```

## API (resumo)

`GET/POST /api/trips` · `GET/PUT/DELETE /api/trips/:id` · `POST /api/trips/:id/duplicate` · `GET /api/trips/:id/export` · `POST /api/trips/import` ·
`POST /api/trips/:id/activities|stays|cities` · `PUT/DELETE /api/activities|stays|cities/:id` · `PUT /api/trips/:id/days/reorder` ·
`GET /api/examples` · `POST /api/examples/:key` · `GET /api/share/:token` (link de visitante, sem login; manda só as partes
que o link libera) · `GET/POST /api/trips/:id/shares` · `PUT/DELETE /api/shares/:id` (links de visitante; `PUT` com
`renew: true` troca o endereço).

## Viagem de exemplo

`server/examples/exemplo.js` define uma viagem fictícia (Japão em 8 dias). Ela pode ser carregada de dois jeitos:

- na tela inicial, **Importar backup** com o arquivo [`examples/viagem-exemplo.json`](../examples/viagem-exemplo.json);
- pela API: `curl -X POST http://localhost:3000/api/examples/exemplo` (com `APP_PASSWORD` definida, precisa do cookie de login).

Para criar outro exemplo, faça um arquivo parecido em `server/examples/` e registre-o em `EXAMPLES` no `server/app.js`.

## Formato do backup

O backup (`GET /api/trips/:id/export`) é um JSON com `trip`, `cities`, `stays`, `activities`, `checklist`, `ideas`, `days`,
`files`, `purchases`, `pages` e `photos`. Ao importar (`POST /api/trips/import`), os `id` são ignorados e a viagem é criada de novo; os anexos
e as fotos do diário não vão no backup (só os dados de cada um). A referência de todos os campos, incluindo `alt` (opções no mesmo horário), `slot` (bloco do dia),
`via` (escalas) e `route` (trem e metrô), está em [Compartilhar e backup](funcionalidades/compartilhar-e-backup.md#formato-do-json).

## Serviços externos

Todos são chamados direto do navegador e não pedem chave: OpenFreeMap (mapa vetorial, com OpenStreetMap raster de reserva),
busca de lugares no OpenStreetMap, rotas a pé em `routing.openstreetmap.de` (OSRM), Open-Meteo (tempo), Frankfurter (câmbio)
e Wikipédia. Sem internet, o app abre pelo cache (PWA), mas mapa novo, tempo e câmbio não atualizam.

## Migração de versões antigas

Bancos criados quando o app tinha uma única viagem (tabela `trip` chave/valor, custo em `cost_jpy`) são migrados sozinhos na primeira execução: a viagem existente vira a viagem nº 1.
