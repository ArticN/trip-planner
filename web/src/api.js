import { sync } from './offline/index.js';

// pedidos ao servidor: a leitura das viagens e as edições passam pela cópia do aparelho e pela fila
// de edições sem internet (offline/sync.js); o resto (login, links, envios de arquivo) vai direto
async function direct(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && !url.startsWith('/api/login')) window.dispatchEvent(new Event('auth-required'));
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(`${method} ${url} → ${res.status} ${msg}`);
  }
  return res.status === 204 ? null : res.json();
}
const req = (method, url, body) => (method === 'GET' ? direct(method, url, body) : sync.request(method, url, body));

export const api = {
  // acesso
  session: () => direct('GET', '/api/session'),
  login: (password) => direct('POST', '/api/login', { password }),
  logout: () => direct('POST', '/api/logout'),
  // viagens
  trips: () => sync.getTrips(),
  trip: (id) => sync.getTrip(Number(id)),
  createTrip: (t) => req('POST', '/api/trips', t),
  saveTrip: (id, patch) => req('PUT', `/api/trips/${id}`, patch),
  deleteTrip: (id) => req('DELETE', `/api/trips/${id}`),
  duplicateTrip: (id) => req('POST', `/api/trips/${id}/duplicate`),
  importTrip: (data) => req('POST', '/api/trips/import', data),
  // atividades/ideias de um JSON para dentro desta viagem; preview só confere (server/importItems.js)
  importItems: (id, data, day, preview) => req('POST', `/api/trips/${id}/import-items?${new URLSearchParams({ ...(day ? { day } : {}), ...(preview ? { preview: '1' } : {}) })}`, data),
  loadExample: (key) => req('POST', `/api/examples/${encodeURIComponent(key)}`),
  createShare: (id, link) => req('POST', `/api/trips/${id}/shares`, link),
  updateShare: (sid, patch) => req('PUT', `/api/shares/${sid}`, patch),
  deleteShare: (sid) => req('DELETE', `/api/shares/${sid}`),
  shared: (token) => req('GET', `/api/share/${encodeURIComponent(token)}`),
  places: () => req('GET', '/api/places'),
  settings: () => req('GET', '/api/settings'),
  saveSettings: (patch) => req('PUT', '/api/settings', patch),
  calendar: (id) => req('POST', `/api/trips/${id}/calendar`),
  uncalendar: (id) => req('DELETE', `/api/trips/${id}/calendar`),
  // atividades
  createActivity: (tripId, a) => req('POST', `/api/trips/${tripId}/activities`, a),
  updateActivity: (id, patch) => req('PUT', `/api/activities/${id}`, patch),
  deleteActivity: (id) => req('DELETE', `/api/activities/${id}`),
  saveDayNotes: (tripId, day, d) => req('PUT', `/api/trips/${tripId}/daynotes/${day}`, d),
  reorderDay: (tripId, day, ids) => req('PUT', `/api/trips/${tripId}/days/reorder`, { day, ids }),
  // anexos: o corpo vai cru (sem base64), com nome e tipo nos cabeçalhos.
  // owner: 'activity' | 'idea' | 'trip' (arquivo da página de ingressos, solto ou de um item da checklist: file.checkId).
  // Sem internet (ou com o item ainda só no aparelho) o arquivo fica guardado no aparelho e sobe sozinho
  // quando a internet voltar: a resposta vem com queued: true e não entra em data.files ainda.
  uploadFile: async (owner, id, file, tripId = null) => {
    const url = owner === 'trip' ? `/api/trips/${id}/files` : `/api/${owner === 'idea' ? 'ideas' : 'activities'}/${id}/files`;
    const headers = { 'X-File-Name': encodeURIComponent(file.name || 'arquivo'), 'X-File-Type': file.type || 'application/octet-stream', 'X-File-Kind': file.kind || 'doc' };
    const trip = owner === 'trip' ? Number(id) : tripId ?? file.tripId ?? null;
    const queue = () => sync.queueUpload({
      tripId: trip, url, blob: file, name: file.name || 'arquivo', type: file.type || 'application/octet-stream', size: file.size, kind: file.kind || 'doc', headers,
      activity_id: owner === 'activity' ? id : null, idea_id: owner === 'idea' ? id : null, check_id: file.checkId ?? null,
    }).then((meta) => ({ ...meta, queued: true }));
    if (trip != null && (!navigator.onLine || Number(id) < -1e9 || Number(file.checkId) < -1e9)) return queue();
    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream', ...headers, ...(file.checkId ? { 'X-Check-Id': String(file.checkId) } : {}) },
        body: file,
      });
    } catch (e) {
      if (trip != null) return queue(); // a rede caiu no meio
      throw e;
    }
    if (res.status === 401) window.dispatchEvent(new Event('auth-required'));
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `erro ${res.status}`);
    const row = await res.json();
    sync.noteCreated('files', row.trip_id ?? trip, row).catch(() => {});
    return row;
  },
  deleteFile: (id) => req('DELETE', `/api/files/${id}`),
  fileUrl: (id) => `/api/files/${id}`,
  // diário de viagem: a miniatura e a foto vão juntas no corpo (X-Thumb-Length separa as duas)
  resolveVideo: (url) => req('POST', '/api/video/resolve', { url }),
  createPage: (tripId, p) => req('POST', `/api/trips/${tripId}/pages`, p),
  updatePage: (id, patch) => req('PUT', `/api/pages/${id}`, patch),
  deletePage: (id) => req('DELETE', `/api/pages/${id}`),
  uploadPhoto: async (tripId, { thumb, full, day, taken, w, h, lat, lng, activity, meta }) => {
    const res = await fetch(`/api/trips/${tripId}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream', 'X-Thumb-Length': String(thumb.size), 'X-Day': day || '', 'X-Taken': taken || '', 'X-W': String(w || ''), 'X-H': String(h || ''),
        'X-Lat': lat == null ? '' : String(lat), 'X-Lng': lng == null ? '' : String(lng), 'X-Activity': activity ? String(activity) : '',
        'X-Meta': meta ? encodeURIComponent(JSON.stringify(meta)).slice(0, 1500) : '' },
      body: new Blob([thumb, full]),
    });
    if (res.status === 401) window.dispatchEvent(new Event('auth-required'));
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `erro ${res.status}`);
    const row = await res.json();
    sync.noteCreated('photos', Number(tripId), row).catch(() => {});
    return row;
  },
  updatePhoto: (id, patch) => req('PUT', `/api/photos/${id}`, patch),
  deletePhoto: (id) => req('DELETE', `/api/photos/${id}`),
  photoUrl: (id) => `/api/photos/${id}`,
  thumbUrl: (id) => `/api/photos/${id}/thumb`,
  // hospedagens
  createStay: (tripId, s) => req('POST', `/api/trips/${tripId}/stays`, s),
  updateStay: (id, patch) => req('PUT', `/api/stays/${id}`, patch),
  deleteStay: (id) => req('DELETE', `/api/stays/${id}`),
  // checklist
  createCheck: (tripId, c) => req('POST', `/api/trips/${tripId}/checklist`, c),
  updateCheck: (id, patch) => req('PUT', `/api/checklist/${id}`, patch),
  deleteCheck: (id) => req('DELETE', `/api/checklist/${id}`),
  // compras
  createPurchase: (tripId, x) => req('POST', `/api/trips/${tripId}/purchases`, x),
  updatePurchase: (id, patch) => req('PUT', `/api/purchases/${id}`, patch),
  deletePurchase: (id) => req('DELETE', `/api/purchases/${id}`),
  // notas de viagem
  guides: () => req('GET', '/api/guides'),
  loadGuide: (tripId, key) => req('POST', `/api/trips/${tripId}/notes/guide/${encodeURIComponent(key)}`),
  createNote: (tripId, x) => req('POST', `/api/trips/${tripId}/notes`, x),
  updateNote: (id, patch) => req('PUT', `/api/notes/${id}`, patch),
  deleteNote: (id) => req('DELETE', `/api/notes/${id}`),
  // ideias
  createIdea: (tripId, x) => req('POST', `/api/trips/${tripId}/ideas`, x),
  updateIdea: (id, patch) => req('PUT', `/api/ideas/${id}`, patch),
  deleteIdea: (id) => req('DELETE', `/api/ideas/${id}`),
  scheduleIdea: (id, day) => req('POST', `/api/ideas/${id}/schedule`, { day }),
  unscheduleActivity: (id) => req('POST', `/api/activities/${id}/unschedule`),
  // cidades
  createCity: (tripId, c) => req('POST', `/api/trips/${tripId}/cities`, c),
  updateCity: (id, patch) => req('PUT', `/api/cities/${id}`, patch),
  deleteCity: (id) => req('DELETE', `/api/cities/${id}`),
};
