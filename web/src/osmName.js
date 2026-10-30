// nome de um resultado do Nominatim: português, depois inglês, depois romaji; o nome local (kanji etc.) vai à parte
export const OSM_LANG = 'accept-language=pt-BR,en&namedetails=1';

export function osmName(r) {
  const n = r.namedetails || {};
  const local = n.name || r.name || '';
  const title = n['name:pt-BR'] || n['name:pt'] || n['name:en'] || n['name:ja-Latn'] || n['name:ja_rm'] || local || (r.display_name || '').split(',')[0];
  return { title, local: local && local !== title ? local : '' };
}
