// achar posição pelo que a pessoa cola: coordenadas, link do Google Maps e endereços do Google
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCoords, parseMapsLink, simplerQueries, cleanName, km } from '../web/src/geocode.js';

test('coordenadas coladas em vários formatos', () => {
  assert.deepEqual(parseCoords('35.6586, 139.7454'), { lat: 35.6586, lng: 139.7454 });
  assert.deepEqual(parseCoords('-23.5505 -46.6333'), { lat: -23.5505, lng: -46.6333 });
  assert.deepEqual(parseCoords('-23,5505; -46,6333'), { lat: -23.5505, lng: -46.6333 });
  assert.deepEqual(parseCoords(`35°39'31.0"N 139°44'43.4"E`), { lat: 35.658611, lng: 139.745389 });
  assert.deepEqual(parseCoords('22°54′S 43°10′O'), { lat: -22.9, lng: -43.166667 });
  assert.equal(parseCoords('Rua Augusta 123'), null);
  assert.equal(parseCoords('12, 34'), null); // número de casa, não coordenada
  assert.equal(parseCoords('95.1, 10.2'), null);
});

test('link do Google Maps: pino do lugar, ?q= e nome', () => {
  const place = parseMapsLink('https://www.google.com/maps/place/%25+ARABICA+Tokyo+Nakameguro/@35.6466,139.6965,17z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d35.646612!4d139.699012!16s');
  assert.deepEqual(place, { lat: 35.646612, lng: 139.699012, name: '% ARABICA Tokyo Nakameguro' });
  assert.deepEqual(parseMapsLink('https://maps.google.com/?q=35.1,135.2'), { lat: 35.1, lng: 135.2, name: '' });
  assert.deepEqual(parseMapsLink('https://www.google.com/maps/@35.7,139.8,15z'), { lat: 35.7, lng: 139.8, name: '' });
  assert.deepEqual(parseMapsLink('https://www.google.com/maps/search/?api=1&query=Tokyo+Tower'), { name: 'Tokyo Tower' });
  assert.deepEqual(parseMapsLink('veja https://maps.app.goo.gl/AbC123 aqui'), { short: true, url: 'https://maps.app.goo.gl/AbC123' });
  assert.equal(parseMapsLink('https://example.com/@1.5,2.5'), null);
});

test('endereço do Google vira bairro/distrito quando o completo não é achado', () => {
  assert.deepEqual(simplerQueries('Japão, 〒153-0042 Tokyo, Meguro City, Aobadai, 1 Chome−17−5 メゾン青葉 １０１').slice(0, 2), ['Japão, Tokyo, Meguro City, Aobadai', 'Japão, Tokyo, Meguro City']);
  assert.equal(simplerQueries('2 Chome-21-1 Asakusa, Taito City, Tokyo 111-0032, Japan')[0], 'Asakusa, Taito City, Tokyo, Japan');
  assert.equal(simplerQueries('〒153-0042 東京都目黒区青葉台1丁目17−5 メゾン青葉 101')[0], '東京都 目黒区 青葉台');
});

test('nome e distância', () => {
  assert.equal(cleanName('% ARABICA Tokyo Nakameguro'), 'ARABICA Tokyo Nakameguro');
  assert.ok(Math.abs(km({ lat: 35.6812, lng: 139.7671 }, { lat: 34.7025, lng: 135.4959 }) - 403) < 5); // Tóquio–Osaka
});
