async function req(method, url, body) {
  const res = await fetch(url, {
    method,
    keepalive: method === 'DELETE', // exclusão adiada ainda chega ao servidor se a página fechar
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

export const api = {
  // acesso
  session: () => req('GET', '/api/session'),
  login: (password) => req('POST', '/api/login', { password }),
  logout: () => req('POST', '/api/logout'),
  // viagens
  trips: () => req('GET', '/api/trips'),
  trip: (id) => req('GET', `/api/trips/${id}`),
  createTrip: (t) => req('POST', '/api/trips', t),
  saveTrip: (id, patch) => req('PUT', `/api/trips/${id}`, patch),
  deleteTrip: (id) => req('DELETE', `/api/trips/${id}`),
  duplicateTrip: (id) => req('POST', `/api/trips/${id}/duplicate`),
  importTrip: (data) => req('POST', '/api/trips/import', data),
  share: (id) => req('POST', `/api/trips/${id}/share`),
  unshare: (id) => req('DELETE', `/api/trips/${id}/share`),
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
  // anexos: o corpo vai cru (sem base64), com nome e tipo nos cabeçalhos
  uploadFile: async (owner, id, file) => {
    const res = await fetch(`/api/${owner === 'idea' ? 'ideas' : 'activities'}/${id}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream', 'X-File-Name': encodeURIComponent(file.name || 'arquivo'), 'X-File-Type': file.type || 'application/octet-stream', 'X-File-Kind': file.kind || 'doc' },
      body: file,
    });
    if (res.status === 401) window.dispatchEvent(new Event('auth-required'));
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `erro ${res.status}`);
    return res.json();
  },
  deleteFile: (id) => req('DELETE', `/api/files/${id}`),
  fileUrl: (id) => `/api/files/${id}`,
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
