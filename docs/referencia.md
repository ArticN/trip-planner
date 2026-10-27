# Referência técnica

## Backup (JSON)

*Exportar backup* (menu ⋯ da viagem) gera um arquivo com `trip`, `cities`, `stays`, `activities`, `checklist`,
`ideas`, `days` e `purchases`. *Importar backup* (tela inicial) cria uma viagem nova a partir dele. Os tokens de
compartilhamento e de agenda não vão no arquivo.

As opções de um mesmo horário compartilham o campo `alt` (mesmo texto, mesmo dia); a primeira é a principal, que
conta no orçamento, na agenda e no PDF.

## Trem e metrô entre atividades (campo `route`)

Cada atividade pode guardar como se chega a ela a partir da anterior do dia (na primeira do dia, a partir da
hospedagem). No editor é a seção "Trem ou metrô até aqui"; no backup JSON vai como objeto (ou texto JSON):

```json
"route": { "rides": [{
  "mode": "metro", "line": "Ginza", "code": "G", "color": "#FF9500", "dir": "sentido Asakusa", "min": 18, "cost": 210,
  "from": { "name": "Ginza", "lat": 35.6717, "lng": 139.7650 },
  "to": { "name": "Asakusa", "lat": 35.7111, "lng": 139.7964 },
  "stops": [{ "name": "Ueno", "lat": 35.7114, "lng": 139.7768 }]
}] }
```

`mode`: metro, train, shinkansen, bus, tram ou ferry. Obrigatórios: `from` e `to` com `lat`/`lng`. Opcionais:
`line`, `code`, `color` (hex), `dir`, `stops` (estações intermediárias, para a linha seguir o traçado), `min`
(minutos no trem; sem ele, estimado pela distância) e `cost`. Vários trechos são baldeações. Os trechos a pé
(anterior → embarque, desembarque → próximo embarque, último desembarque → atividade) são calculados pelas ruas.

## Viagens de exemplo

`server/examples/demo.js` é um roteiro fictício. Para adicionar outro, crie um arquivo parecido em
`server/examples/` (exportando `TRIP`, `EXAMPLE`, `CITIES`, `STAYS` e `ACTIVITIES`) e registre-o em `EXAMPLES` no
`server/app.js`. Ele fica disponível em `POST /api/examples/<chave>`.

## API (resumo)

`GET/POST /api/trips` · `GET/PUT/DELETE /api/trips/:id` · `POST /api/trips/:id/duplicate` ·
`GET /api/trips/:id/export` · `POST /api/trips/import` · `POST /api/trips/:id/activities|stays|cities` ·
`PUT/DELETE /api/activities|stays|cities/:id` · `PUT /api/trips/:id/days/reorder` · `GET /api/examples`,
`POST /api/examples/:key` · `GET /api/session`, `POST /api/login`, `POST /api/logout`.

## Migração

Bancos criados quando o app tinha uma única viagem são migrados automaticamente na primeira execução: a viagem
existente vira a viagem nº 1, com atividades, hospedagens e custos preservados.

## Design e skills

O visual (preto chapado, tipografia Instrument Sans/Serif, uma cor de destaque, botão primário em pílula branca)
segue o guia da skill `design-taste-frontend`. Skills instaladas em `.claude/skills/`:

- `design-taste-frontend` (de leonxlnx/taste-skill): completa, com os scripts locais `lint.mjs`, `draw.mjs` e
  `inspect.mjs`. Rode `node .claude/skills/design-taste-frontend/scripts/lint.mjs --app web/src` para checar a interface.
- `impeccable` (de pbakaus/impeccable): apenas `SKILL.md` e `reference/`, como guia de design. O launcher e os hooks
  não foram instalados, porque baixam e executam um binário que não foi auditado.
