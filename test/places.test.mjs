// "Explorar área": pergunta ao Overpass, categorias, endereço e ordem da lista
import test from 'node:test';
import assert from 'node:assert/strict';
import { areaQuery, catOf, typeLabel, addressOf, parseArea, sortPlaces, fmtMeters, fmtRadius } from '../web/src/places.js';

const C = { lat: 35.0, lng: 135.0 };
const at = (dLat) => ({ lat: C.lat + dLat, lon: C.lng });

test('a pergunta tem o recorte do círculo e um limite por categoria', () => {
  const q = areaQuery(C, 1000);
  assert.match(q, /^\[out:json\]/);
  assert.ok(q.includes('(around:1000,35.00000,135.00000)'));
  assert.equal((q.match(/out center tags \d+;/g) || []).length, 7);
});

test('categoria e tipo pelas etiquetas do OpenStreetMap', () => {
  assert.equal(catOf({ amenity: 'restaurant' }), 'food');
  assert.equal(catOf({ amenity: 'cafe' }), 'cafe');
  assert.equal(catOf({ shop: 'bakery' }), 'cafe');
  assert.equal(catOf({ amenity: 'bar' }), 'night');
  assert.equal(catOf({ amenity: 'place_of_worship', religion: 'shinto' }), 'temple');
  assert.equal(catOf({ tourism: 'museum' }), 'sight');
  assert.equal(catOf({ leisure: 'garden' }), 'park');
  assert.equal(catOf({ shop: 'books' }), 'shop');
  assert.equal(catOf({ highway: 'bus_stop' }), null);
  assert.equal(typeLabel({ amenity: 'restaurant', cuisine: 'ramen;japanese' }), 'Restaurante · ramen');
  assert.equal(typeLabel({ amenity: 'restaurant', cuisine: 'italian' }), 'Restaurante · italiana');
  assert.equal(typeLabel({ amenity: 'place_of_worship', religion: 'shinto' }), 'Santuário xintoísta');
  assert.equal(typeLabel({ tourism: 'viewpoint' }), 'Mirante');
});

test('endereço: rua e número, ou bairro e quadra no Japão', () => {
  assert.equal(addressOf({ 'addr:street': 'Rua Augusta', 'addr:housenumber': '12', 'addr:city': 'São Paulo' }), 'Rua Augusta 12, São Paulo');
  assert.equal(addressOf({ 'addr:quarter': 'Gion', 'addr:block_number': '3', 'addr:housenumber': '5', 'addr:city': 'Kyoto' }), 'Gion 3-5, Kyoto');
  assert.equal(addressOf({ 'addr:full': '東京都渋谷区1-2-3' }), '東京都渋谷区1-2-3');
  assert.equal(addressOf({}), '');
});

test('resposta do Overpass: fora do círculo, repetidos e sem nome saem', () => {
  const json = {
    elements: [
      { type: 'node', id: 1, ...at(0.001), tags: { amenity: 'restaurant', name: 'ラーメン一', 'name:en': 'Ramen Ichi', cuisine: 'ramen' } },
      { type: 'node', id: 1, ...at(0.001), tags: { amenity: 'restaurant', name: 'ラーメン一' } },
      { type: 'way', id: 2, center: at(0.004), tags: { tourism: 'museum', name: 'Museu', wikidata: 'Q1' } },
      { type: 'node', id: 3, ...at(0.05), tags: { amenity: 'cafe', name: 'Longe' } },
      { type: 'node', id: 4, ...at(0.002), tags: { amenity: 'cafe' } },
    ],
  };
  const { places, capped } = parseArea(json, C, 1000);
  assert.deepEqual(places.map((p) => p.id), ['node1', 'way2']);
  assert.equal(places[0].name, 'Ramen Ichi');
  assert.equal(places[0].local, 'ラーメン一');
  assert.equal(places[1].star, true);
  assert.deepEqual(capped, []);
});

test('destaques primeiro; "mais perto" só pela distância', () => {
  const list = [
    { id: 'a', d: 100, score: 0 },
    { id: 'b', d: 800, score: 3.5 },
    { id: 'c', d: 300, score: 0.5 },
  ];
  assert.deepEqual(sortPlaces(list, 'star', 1000).map((p) => p.id), ['b', 'c', 'a']);
  assert.deepEqual(sortPlaces(list, 'near', 1000).map((p) => p.id), ['a', 'c', 'b']);
});

test('distâncias e raio em texto', () => {
  assert.equal(fmtMeters(123), '120 m');
  assert.equal(fmtMeters(1530), '1,5 km');
  assert.equal(fmtRadius(500), '500 m');
  assert.equal(fmtRadius(2000), '2 km');
});
