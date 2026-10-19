# 🧳 Trip Planner

Planner para qualquer viagem: várias viagens na mesma instalação, cada uma com mapa, roteiro dia a dia com horários,
cidades, hospedagens e orçamento (moeda da viagem + conversão para a sua moeda).

## Ambiente de desenvolvimento

Requer **Node 22.13+** (usa o `node:sqlite` embutido, sem dependências nativas).

```bash
bash scripts/setup.sh            # copia para ~/trip-planner, roda npm ci e build
cd ~/trip-planner
npm run dev                      # API em :3000 + Vite com hot reload em http://localhost:5173
npm start                        # só o app compilado em http://localhost:3000
```

Esta pasta (`/mnt/project-files/trip-planner`) é a cópia oficial do código, compartilhada entre as conversas do projeto.
Ela é um disco de rede que não aceita os links simbólicos do `node_modules`, por isso o `npm install` roda numa cópia local
criada pelo `setup.sh`. Depois de editar na cópia local, rode `bash scripts/sync-to-shared.sh` para trazer o código de volta.
No seu computador, basta rodar `npm ci && npm run dev` direto na pasta do projeto.

Os dados ficam em `data/planner.db` (SQLite, fora do git) e persistem entre execuções. Para guardar o roteiro editado,
use **Exportar JSON** no menu ⋯ e salve o arquivo junto ao projeto.

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
- **Orçamento** por item, cidade e dia. Imprimir roteiro. Atalhos: ← → trocam de dia. Links: `#/t/<viagem>/<aaaa-mm-dd>`.

## Viagem de exemplo

Na tela inicial, "Carregar exemplo" cria uma viagem de demonstração (Japão 2026, 24 dias, 173 atividades) a partir de `server/examples/japan.js`.
Para adicionar outro exemplo, crie um arquivo parecido em `server/examples/` e registre-o em `EXAMPLES` no `server/index.js`.

## Atualizando de uma versão anterior

Bancos criados quando o app tinha uma única viagem (Japão) são migrados automaticamente na primeira execução: a viagem existente vira a viagem nº 1, com atividades, hospedagens e custos preservados.

## API (resumo)

`GET/POST /api/trips` · `GET/PUT/DELETE /api/trips/:id` · `POST /api/trips/:id/duplicate` · `GET /api/trips/:id/export` · `POST /api/trips/import` ·
`POST /api/trips/:id/activities|stays|cities` · `PUT/DELETE /api/activities|stays|cities/:id` · `PUT /api/trips/:id/days/reorder` · `GET /api/examples`, `POST /api/examples/:key`.

## Observações

- Coordenadas dos exemplos são aproximadas; ajuste arrastando os pontos.
- Mapas (tiles) e busca de locais usam serviços públicos (OSM/Carto) direto do navegador, então precisam de internet.
- Linhas do trajeto são em linha reta (não são rotas de trem/ônibus).
