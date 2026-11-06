// ZIP feito no aparelho para baixar os arquivos dos ingressos de uma vez: node --test
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { crc32, makeZip, safeName } from '../web/src/zip.js';

test('crc32 bate com o valor conhecido', () => {
  assert.equal(crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
});

test('safeName limpa caracteres e não repete nomes', () => {
  const used = new Set();
  assert.equal(safeName('a/b:c.pdf', used), 'a-b-c.pdf');
  assert.equal(safeName('A-B-C.pdf', used), 'A-B-C (2).pdf');
  assert.equal(safeName('', used), 'arquivo');
});

test('makeZip gera um zip que o unzip abre, com nomes em UTF-8', (t) => {
  const files = [
    { name: '2026-11-25 Kaiyūkan ingresso.pdf', data: new TextEncoder().encode('%PDF-1.4 teste') },
    { name: 'voo.png', data: new Uint8Array([137, 80, 78, 71, 0, 1, 2, 255]) },
  ];
  const dir = mkdtempSync(join(tmpdir(), 'zip-'));
  const z = join(dir, 'x.zip');
  writeFileSync(z, makeZip(files));
  try { execFileSync('unzip', ['-v'], { stdio: 'ignore' }); } catch { t.skip('sem unzip'); return; }
  execFileSync('unzip', ['-tq', z]);
  execFileSync('unzip', ['-q', z, '-d', join(dir, 'out')]);
  for (const f of files) assert.deepEqual(new Uint8Array(readFileSync(join(dir, 'out', f.name))), f.data);
});
