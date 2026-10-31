# Compartilhar e backup

[← Índice](README.md)

## Link só de leitura

Menu **⋯ › Compartilhar roteiro › Criar link**. Quem tiver o link vê o roteiro dia a dia, o mapa, o diagrama de metrô e
as hospedagens (nome e datas), sem senha e sem poder editar. Use **Copiar**, **Enviar…** (no celular) ou
**Abrir como visitante** para conferir.

O que **não** aparece no link: notas, links, anexos, números de reserva e de voo, custos e gastos, avaliações, o que
já foi feito, checklist, compras e ideias. Das [opções no mesmo horário](roteiro.md#opções-no-mesmo-horário), aparece a
principal, com as outras citadas embaixo. A cor própria da viagem também vale no link.

**Mostrar gastos e ingressos no link** (no mesmo painel, desligado por padrão) libera para quem tem o link os custos
das atividades e hospedagens, as notas e links das atividades, as compras, os itens de reserva da checklist e o câmbio.
Com isso o link ganha os botões **Gastos** (a [análise da viagem](dinheiro.md#análise-da-viagem)) e **Ingressos** (a
[página de ingressos](organizacao.md#ingressos-e-reservas)), só para ver. Números de reserva e anexos continuam fora.

**Mostrar o diário de viagem no link** (também desligado por padrão) adiciona o botão **Diário**: quem tem o link vê o
[álbum](diario.md) com as fotos, as legendas e os textos das páginas, pode abrir e baixar as fotos, mas não muda nada.
Desligar a opção bloqueia as fotos na hora, mesmo para quem já abriu o link.

**Desativar link** invalida o endereço na hora. Criar de novo gera um link diferente.

## Backup

- **Exportar**: menu **⋯ › Exportar backup (JSON)** baixa um arquivo com a viagem inteira.
- **Importar**: na tela inicial, **Importar backup**, e escolha o arquivo. A viagem é criada de novo, como uma viagem nova
  (não substitui nenhuma existente).

O backup leva viagem, cidades, hospedagens, atividades (com opções, trechos de trem e escalas), checklist, ideias,
temas do dia e compras. **Não leva os anexos** (só a lista com os nomes) nem os links de compartilhamento e de agenda,
que são gerados de novo se você quiser. Também serve para mudar de instalação ou para montar uma viagem inteira fora do
app (numa planilha, num script ou pedindo a uma IA) e importar de uma vez.

## Formato do JSON

Um objeto com `trip`, `cities`, `stays`, `activities`, `checklist`, `ideas`, `days`, `purchases` e `pages` (o export também
traz `files` e `photos`, só com os dados de cada arquivo, ignorados na importação). Obrigatórios: `trip.name`, `trip.start`, `trip.end` e a lista `activities` (pode ser
vazia). Os `id` e `trip_id` são ignorados. Campos vazios podem ser omitidos.

Um exemplo mínimo que funciona:

```json
{
  "trip": { "name": "Lisboa e Porto", "start": "2027-05-10", "end": "2027-05-14", "currency": "EUR", "home_currency": "BRL", "rate": 6.1, "tz": "Europe/Lisbon" },
  "cities": [
    { "key": "lisboa", "name": "Lisboa", "emoji": "🚋", "color": "#c0392b", "lat": 38.7223, "lng": -9.1393 },
    { "key": "porto", "name": "Porto", "emoji": "🍷", "color": "#2874a6", "lat": 41.1579, "lng": -8.6291 }
  ],
  "stays": [
    { "city": "lisboa", "name": "Hotel no Chiado", "check_in": "2027-05-10", "check_out": "2027-05-12", "check_in_time": "15:00" },
    { "city": "porto", "name": "Apartamento na Ribeira", "check_in": "2027-05-12", "check_out": "2027-05-14" }
  ],
  "activities": [
    { "day": "2027-05-10", "title": "Voo São Paulo → Lisboa", "kind": "flight", "start": "22:00", "end": "11:30", "end_day": "2027-05-11",
      "location": "Guarulhos (GRU) → Lisboa (LIS)", "from_code": "GRU", "to_code": "LIS", "start_tz": "America/Sao_Paulo", "end_tz": "Europe/Lisbon", "city": "transito" },
    { "day": "2027-05-11", "title": "Pastel de nata", "kind": "food", "slot": "cafe", "city": "lisboa", "start": "09:00", "alt": "cafe-11", "cost": 3 },
    { "day": "2027-05-11", "title": "Café na Baixa", "kind": "food", "slot": "cafe", "city": "lisboa", "start": "09:00", "alt": "cafe-11", "cost": 6 },
    { "day": "2027-05-11", "title": "Torre de Belém", "kind": "sight", "city": "lisboa", "start": "11:00", "end": "12:30", "lat": 38.6916, "lng": -9.2160,
      "links": [{ "url": "https://www.example.com/ingresso", "label": "ingresso" }] }
  ],
  "checklist": [{ "grp": "Documentos", "text": "Passaporte válido" }],
  "ideas": [{ "title": "Livraria Lello", "city": "porto", "kind": "sight" }]
}
```

O exemplo completo, com trem, opções e escalas, está em [`examples/viagem-exemplo.json`](../../examples/viagem-exemplo.json).

Datas sempre como `AAAA-MM-DD`, horários como `HH:MM` (24h), fusos no formato IANA (`Asia/Tokyo`) e cores em hex (`#c0392b`).

### `trip`

| Campo | O que é |
| --- | --- |
| `name`, `subtitle`, `emoji` | Nome (obrigatório), subtítulo e emoji. |
| `start`, `end` | Primeiro e último dia (obrigatórios). |
| `currency`, `home_currency`, `rate` | Moeda da viagem, sua moeda e quanto 1 unidade da primeira vale na segunda. Padrão BRL, BRL e 1. |
| `rate_auto`, `rate_at` | `0` desliga o câmbio automático; data da última cotação. |
| `tz` | Fuso do destino. |
| `cover`, `accent` | Foto de capa (link ou imagem embutida) e cor própria da viagem. |
| `remind_min`, `remind_flight_min` | Minutos de antecedência dos lembretes (padrão 30 e 180). |
| `scope` | Tipo da viagem: `"domestic"` (nacional), `"international"` ou vazio/`null` (automático, pelas cidades e o país onde você mora). Backups antigos vêm sem o campo e ficam no automático. |
| `usd_rate`, `usd_rate_at`, `quota_usd` | Cotação em dólar para as compras (`usd_rate_at: "manual"` = digitada) e a cota em US$ (padrão 1000). |

### `cities`

`key` (identificador curto, usado pelas atividades, hospedagens e ideias no campo `city`), `name`, `emoji`, `color`,
`lat`, `lng`. A cidade `transito` ("Em trânsito") é criada sozinha se não vier.

### `stays`

`city`, `name`, `address`, `check_in`, `check_out`, `check_in_time`, `check_out_time`, `booking` (nº da reserva),
`cost` (preço total), `link`, `lat`, `lng`, `notes`.

### `activities`

| Campo | O que é |
| --- | --- |
| `day`, `title` | Dia e título (obrigatórios). |
| `kind` | `sight` (ponto turístico, padrão), `food`, `move` (deslocamento), `stay`, `shop`, `free` (tempo livre) ou `flight`. |
| `start`, `end`, `end_day` | Horários e o dia de chegada, quando é outro. |
| `slot` | Bloco do dia: `manha`, `cafe`, `pos_cafe`, `almoco`, `pos_almoco`, `jantar` ou `pos_jantar`. Sem ele, o app decide ([regra](roteiro.md#blocos-do-dia)). |
| `city`, `location`, `lat`, `lng` | Cidade (a `key`), endereço em texto e posição. |
| `details`, `notes` | Detalhes e notas privadas. |
| `links` | Lista `[{ "url": "…", "label": "…" }]` (ou o mesmo como texto JSON). |
| `transport` | Texto do campo Transporte, como `🚶 A pé`, `🚇 Metrô`, `🚕 Táxi`. |
| `cost`, `spent` | Custo previsto e gasto real, na moeda da viagem. |
| `done`, `rating`, `review` | Feita (`1`/`0`), nota de 1 a 5 e comentário. |
| `sort` | Ordem dentro do dia. Se **todas** as atividades tiverem `sort`, ele é respeitado; senão, cada dia é ordenado pelo horário. |
| `alt` | Opções no mesmo horário: atividades do **mesmo dia** com o mesmo texto aqui viram um carrossel. A principal é a que vem primeiro na ordem. |
| `ref`, `from_code`, `to_code`, `via`, `start_tz`, `end_tz` | Trecho: nº do voo, códigos de saída e chegada, escalas (`"ZRH"` ou `"ICN, ADD"`) e fusos de cada ponta. Ver [voos](voos.md). |
| `route` | Trem e metrô até a atividade (abaixo). |

### Trem e metrô (campo `route`)

Como se chega à atividade a partir da anterior do dia (na primeira do dia, a partir da hospedagem). Vai como objeto
(ou texto JSON):

```json
"route": { "rides": [{
  "mode": "metro", "line": "Ginza", "code": "G", "color": "#FF9500", "dir": "sentido Asakusa", "min": 18, "cost": 210,
  "from": { "name": "Ginza", "lat": 35.6717, "lng": 139.7650 },
  "to": { "name": "Asakusa", "lat": 35.7111, "lng": 139.7964 },
  "stops": [{ "name": "Ueno", "lat": 35.7114, "lng": 139.7768 }]
}] }
```

- `mode`: `metro`, `train`, `shinkansen` (trem de alta velocidade), `bus`, `tram` (bonde) ou `ferry` (balsa).
- Obrigatórios: `from` e `to`, com `lat` e `lng`. Trechos sem as duas estações são descartados.
- Opcionais: `line`, `code` (sigla), `color` (sem ela, a cor do tipo), `dir` (sentido), `stops` (estações
  intermediárias, para a linha seguir o traçado; só dá para cadastrar por aqui), `min` (minutos no trem; sem ele,
  estimado pela distância) e `cost`.
- Mais de um item em `rides` é uma baldeação. Os trechos a pé entre a atividade anterior, as estações e a atividade
  são calculados pelas ruas.

### `checklist`, `ideas`, `days`, `purchases` e `pages`

- `checklist`: `text` (obrigatório), `grp` (grupo), `done`.
- `ideas`: `title` (obrigatório), `kind`, `city`, `location`, `details`, `cost`, `lat`, `lng`, `notes`, `links`.
- `days`: tema e anotações de cada dia: `day`, `title`, `notes`.
- `purchases`: `title` (obrigatório), `store`, `city`, `day`, `price` (moeda da viagem), `grp`, `bought`, `exempt` (fora da cota), `notes`.
- `pages`: as páginas do [diário](diario.md): `day` (opcional), `title` e `blocks`. Um bloco de texto é `{ "type": "text", "style": "nota" | "titulo" | "citacao", "text": "…" }`; um bloco de vídeo é `{ "type": "video", "yt": "<código de 11 caracteres do YouTube>", "vertical": true | false, "caption": "…" }`; os blocos de fotos (`{ "type": "photos", "layout", "ids" }`) são ignorados na importação, porque as fotos não vão no backup. Backups da versão 1.38 trazem `journal` (`day`, `text`), que vira uma página com um bloco de nota.

### Backups antigos

Backups da época em que o app tinha uma viagem só (custo em `cost_jpy`, câmbio em `brl_rate`) também são aceitos.
