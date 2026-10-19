# 🗾 Japan Planner

Planner de viagem com mapa, rota dia a dia, timeline com horários, hospedagens e orçamento.
Dados iniciais importados do Notion "Planner de Viagem - Japão".

## Ambiente de desenvolvimento

Requer **Node 22.13+** (usa o `node:sqlite` embutido, sem dependências nativas).

```bash
bash scripts/setup.sh            # copia para ~/japan-planner, roda npm ci e build
cd ~/japan-planner
npm run dev                      # API em :3000 + Vite com hot reload em http://localhost:5173
npm start                        # só o app compilado em http://localhost:3000
```

Esta pasta (`/mnt/project-files/japan-planner`) é a cópia oficial do código, compartilhada entre as conversas do projeto.
Ela é um disco de rede que não aceita os links simbólicos do `node_modules`, por isso o `npm install` roda numa cópia local
criada pelo `setup.sh`. Depois de editar na cópia local, rode `bash scripts/sync-to-shared.sh` para trazer o código de volta.
No seu computador, basta rodar `npm ci && npm run dev` direto na pasta do projeto.

Os dados ficam em `data/planner.db` (SQLite, fora do git) e persistem entre execuções. Para guardar o roteiro editado,
use **Exportar JSON** no menu ⋯ e salve o arquivo junto ao projeto.

### Estrutura

```
server/index.js    API Express + SQLite (rotas /api/*) e serve o build do front
server/seed.js     dados iniciais do roteiro (importados do Notion)
web/src/           front-end React: App, DayPanel, TripPanel, MapView (Leaflet), Modals
vite.config.js     Vite com proxy de /api para :3000
scripts/           setup.sh e sync-to-shared.sh
```

## O que tem

- **Visão geral**: rota entre hospedagens, bate-voltas (tracejado), cidades com contagem de pontos turísticos, lista de dias, camadas por tipo.
- **Dia a dia**: timeline com horário, duração, custo, distância em linha reta entre paradas, trajeto numerado no mapa com setas.
- **Edição**: criar/editar/excluir, marcar como feito, arrastar para reordenar, "Ordenar por horário", arrastar marcadores no mapa (✋ Mover pontos), buscar local (OpenStreetMap) ou clicar no mapa.
- **Alertas**: horários sobrepostos e atividades sem local no mapa.
- **Hospedagens** e **Orçamento** (¥ → R$, câmbio editável).
- **Backup**: exportar/importar JSON, restaurar roteiro do Notion, imprimir roteiro.
- Atalhos: ← → trocam de dia. Links por dia (`#/2026-11-12`).

## Observações

- As coordenadas do seed são aproximadas; ajuste arrastando os pontos.
- Mapas (tiles) e busca de locais usam serviços públicos (OSM/Carto) direto do navegador, então precisam de internet.
- Linhas do trajeto são em linha reta (não são rotas de trem/ônibus).
