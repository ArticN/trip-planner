import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@libsql/client';

// Banco: Turso (nuvem) quando TURSO_DATABASE_URL existe; senão um arquivo SQLite local.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const remote = process.env.TURSO_DATABASE_URL;
let url = remote;
if (!url) {
  const file = process.env.DB_PATH || path.join(ROOT, 'data', 'planner.db');
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  url = file === ':memory:' ? ':memory:' : `file:${file}`;
}
const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
export const isRemote = !!remote;

// linhas como objetos simples (o JSON das respostas fica igual ao de antes)
const plain = (rs) => rs.rows.map((r) => Object.fromEntries(rs.columns.map((c, i) => [c, r[i]])));
const stmt = (sql, args = []) => ({ sql, args: args.map((v) => (v === undefined ? null : v)) });

export const db = {
  all: async (sql, args) => plain(await client.execute(stmt(sql, args))),
  get: async (sql, args) => plain(await client.execute(stmt(sql, args)))[0],
  run: async (sql, args) => {
    const r = await client.execute(stmt(sql, args));
    return { lastInsertRowid: r.lastInsertRowid == null ? null : Number(r.lastInsertRowid), changes: r.rowsAffected };
  },
  exec: (sql) => client.executeMultiple(sql),
  // vários comandos numa ida só ao banco, tudo ou nada
  batch: async (list) => (await client.batch(list.map(([sql, args]) => stmt(sql, args)), 'write')).map((r) => ({ lastInsertRowid: r.lastInsertRowid == null ? null : Number(r.lastInsertRowid), rows: plain(r) })),
};
