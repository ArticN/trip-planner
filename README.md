# 🧳 Trip Planner

Planner para qualquer viagem: várias viagens na mesma instalação, cada uma com mapa, roteiro dia a dia com horários,
cidades, hospedagens e orçamento (moeda da viagem + conversão para a sua moeda).

## Ambiente de desenvolvimento

Requer **Node 22.13+**.

```bash
npm ci
npm run dev      # API em :3000 + Vite com hot reload em http://localhost:5173
npm start        # só o app compilado (depois de npm run build) em http://localhost:3000
```

Localmente os dados ficam em `data/planner.db` (SQLite, fora do git). O banco é acessado pelo `@libsql/client`,
que usa esse arquivo no computador e o **Turso** quando publicado.

## Publicar na web (grátis): Vercel + Turso

1. **Banco (Turso)**: crie uma conta em https://turso.tech (grátis, sem cartão), crie um banco e gere um token.
   Guarde a URL (`libsql://….turso.io`) e o token.
2. **App (Vercel)**: em https://vercel.com, "Add New → Project", importe o repositório `trip-planner`.
   O `vercel.json` já define o build (`npm run build`, saída `dist`) e a API em `api/index.js`.
3. Em **Settings → Environment Variables** do projeto na Vercel, crie:
   - `TURSO_DATABASE_URL` = a URL do banco
   - `TURSO_AUTH_TOKEN` = o token
   - `APP_PASSWORD` = a senha para entrar no app (o link é público; sem ela qualquer pessoa edita)
4. Faça o deploy (ou "Redeploy" depois de criar as variáveis). As tabelas são criadas sozinhas no primeiro acesso.
5. **Levar os dados do computador**: no app local, menu ⋯ → *Exportar backup (JSON)* de cada viagem; no app publicado,
   tela inicial → *Importar backup*.

No celular, abra o link e use "Adicionar à tela inicial" para ter um ícone como app.

Variáveis também aceitas localmente: `DB_PATH` (arquivo do banco), `PORT`, `APP_PASSWORD`.

### Estrutura

```
server/index.js    API Express + SQLite (rotas /api/*) e serve o build do front
server/examples/   viagens de exemplo que podem ser carregadas na tela inicial
web/src/           front-end React: App (rotas), Home (viagens), TripView, DayPanel, TripPanel, MapView (Leaflet), Modals
vite.config.js     Vite com proxy de /api para :3000
scripts/           setup.sh e sync-to-shared.sh
```

## O que tem

- **Minhas viagens**: tela inicial com todas as viagens, contagem regressiva, criar, duplicar, excluir, importar/exportar backup (JSON).
- **Nova viagem**: nome, datas, ícone, moeda da viagem e sua moeda (com câmbio editável).
- **Tema escuro** por padrão (alternável no menu ⋯ ou na tela inicial; a escolha fica salva no navegador), com mapa-base escuro.
- **Visão geral**: barra "Rota da viagem" no topo do mapa (cidades coloridas na ordem de visita), pins em gota por cidade, rota entre hospedagens, bate-voltas (tracejado), cidades com contagem de pontos turísticos, lista de dias, camadas por tipo.
- **Dia a dia**: timeline com horário, duração, custo, distância em linha reta entre paradas, trajeto numerado no mapa com setas.
- **Edição**: criar/editar/excluir atividades, marcar como feito, arrastar para reordenar, "Ordenar por horário", arrastar marcadores no mapa (✋ Mover pontos), buscar local (OpenStreetMap) ou clicar no mapa.
- **Cidades e locais** e **Hospedagens**: cadastro por viagem (a cidade nova já busca a posição no mapa).
- **Alertas**: horários sobrepostos e atividades sem local no mapa.
- **Checklist** por viagem (documentos, reservas, mala, outros), com progresso.
- **Estatísticas**: gasto total e por dia, distância por dia (sem voos), noites, atividades e gasto por cidade e por tipo.
- **Calendário** do roteiro em grade semanal; clicar num dia abre o roteiro dele.
- **Notas e links** em cada atividade (código de reserva, ingresso, comprovante no Drive). Arquivos não são enviados ao app: guarde o link.
- **Hospedagens completas**: horário de check-in/out, nº da reserva, preço (entra no orçamento) e link; aparecem no cabeçalho do dia.
- **Trechos com fuso** (voo, trem): códigos de saída e chegada, nº do voo, dia e fuso de cada ponta. A duração e o `.ics` usam os fusos. O fuso do destino fica em "Editar viagem".
- **Ideias**: lista de lugares sem dia na visão geral (anel tracejado no mapa); "Agendar…" manda para um dia e "Mover para ideias" faz o caminho inverso.
- **Adição rápida**: "Buscar lugar para adicionar" e "+ No mapa" abrem o cadastro já com nome, endereço, posição e cidade mais próxima (atividade no dia aberto, ideia na visão geral).
- **Modo hoje**: durante a viagem o app abre no dia atual (no fuso do destino), destaca a atividade de agora ou a próxima e mostra "Como chegar" (Google Maps).
- **Exportar**: imprimir ou salvar PDF (inclui checklist, notas e links) e arquivo `.ics` para Google Agenda / Apple Calendário (horários sem fuso, no horário local).
- **Orçamento** por item, cidade e dia. Imprimir roteiro. Atalhos: ← → trocam de dia. Links: `#/t/<viagem>/<aaaa-mm-dd>`.

## Viagem de exemplo

Na tela inicial, "Carregar exemplo" cria uma viagem de demonstração (Japão 2026, 24 dias, 173 atividades) a partir de `server/examples/japan.js`.
Para adicionar outro exemplo, crie um arquivo parecido em `server/examples/` e registre-o em `EXAMPLES` no `server/index.js`.

## Atualizando de uma versão anterior

Bancos criados quando o app tinha uma única viagem (Japão) são migrados automaticamente na primeira execução: a viagem existente vira a viagem nº 1, com atividades, hospedagens e custos preservados.

## API (resumo)

`GET/POST /api/trips` · `GET/PUT/DELETE /api/trips/:id` · `POST /api/trips/:id/duplicate` · `GET /api/trips/:id/export` · `POST /api/trips/import` ·
`POST /api/trips/:id/activities|stays|cities` · `PUT/DELETE /api/activities|stays|cities/:id` · `PUT /api/trips/:id/days/reorder` · `GET /api/examples`, `POST /api/examples/:key`.

## Design e skills

O visual (preto chapado, tipografia Instrument Sans/Serif, uma cor de destaque, botão primário em pílula branca) segue o guia da skill `design-taste-frontend`.

Skills instaladas em `.claude/skills/`:

- `design-taste-frontend` (de leonxlnx/taste-skill): completa, com os scripts locais `lint.mjs`, `draw.mjs` e `inspect.mjs`. Rode `node .claude/skills/design-taste-frontend/scripts/lint.mjs --app web/src` para checar a interface.
- `impeccable` (de pbakaus/impeccable): apenas `SKILL.md` e `reference/`, como guia de design. O launcher e os hooks não foram instalados, porque baixam e executam um binário que não foi auditado.

## Observações

- Coordenadas dos exemplos são aproximadas; ajuste arrastando os pontos.
- Mapas (tiles) e busca de locais usam serviços públicos (OSM/Carto) direto do navegador, então precisam de internet.
- Linhas do trajeto são em linha reta (não são rotas de trem/ônibus).
