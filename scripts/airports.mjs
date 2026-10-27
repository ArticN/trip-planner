#!/usr/bin/env node
// Gera web/src/airports.json: código IATA → [lat, lng, cidade] dos aeroportos com voos regulares
// (OurAirports, domínio público), para o trajeto do voo no mapa-múndi funcionar offline.
// Uso: node scripts/airports.mjs [airports.csv]  (sem arquivo, baixa o CSV do OurAirports)
import { readFile, writeFile } from 'node:fs/promises';

const SRC = 'https://davidmegginson.github.io/ourairports-data/airports.csv';
const OUT = new URL('../web/src/airports.json', import.meta.url);

const text = process.argv[2] ? await readFile(process.argv[2], 'utf8') : await (await fetch(SRC)).text();

// CSV com aspas (nomes com vírgula)
function* rows(s) {
  let row = [];
  let f = '';
  let q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"' && s[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; } else if (c === '\n') { row.push(f); yield row; row = []; f = ''; } else if (c !== '\r') f += c;
  }
  if (f || row.length) { row.push(f); yield row; }
}

const it = rows(text);
const head = it.next().value;
const col = Object.fromEntries(head.map((h, i) => [h, i]));
const out = {};
for (const r of it) {
  const code = r[col.iata_code];
  const type = r[col.type];
  if (!/^[A-Z]{3}$/.test(code || '')) continue;
  if (!(type === 'large_airport' || (type === 'medium_airport' && r[col.scheduled_service] === 'yes'))) continue;
  // se dois aeroportos têm o mesmo código, fica o maior
  if (out[code] && type !== 'large_airport') continue;
  const lat = Math.round(Number(r[col.latitude_deg]) * 100) / 100;
  const lng = Math.round(Number(r[col.longitude_deg]) * 100) / 100;
  out[code] = [lat, lng, r[col.municipality] || r[col.name]];
}
const sorted = Object.fromEntries(Object.keys(out).sort().map((k) => [k, out[k]]));
await writeFile(OUT, JSON.stringify(sorted));
console.log(`${Object.keys(sorted).length} aeroportos → web/src/airports.json`);
