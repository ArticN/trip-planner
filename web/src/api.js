async function req(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(`${method} ${url} → ${res.status} ${msg}`);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  // viagens
  trips: () => req('GET', '/api/trips'),
  trip: (id) => req('GET', `/api/trips/${id}`),
  createTrip: (t) => req('POST', '/api/trips', t),
  saveTrip: (id, patch) => req('PUT', `/api/trips/${id}`, patch),
  deleteTrip: (id) => req('DELETE', `/api/trips/${id}`),
  duplicateTrip: (id) => req('POST', `/api/trips/${id}/duplicate`),
  importTrip: (data) => req('POST', '/api/trips/import', data),
  examples: () => req('GET', '/api/examples'),
  loadExample: (key) => req('POST', `/api/examples/${key}`),
  // atividades
  createActivity: (tripId, a) => req('POST', `/api/trips/${tripId}/activities`, a),
  updateActivity: (id, patch) => req('PUT', `/api/activities/${id}`, patch),
  deleteActivity: (id) => req('DELETE', `/api/activities/${id}`),
  reorderDay: (tripId, day, ids) => req('PUT', `/api/trips/${tripId}/days/reorder`, { day, ids }),
  // hospedagens
  createStay: (tripId, s) => req('POST', `/api/trips/${tripId}/stays`, s),
  updateStay: (id, patch) => req('PUT', `/api/stays/${id}`, patch),
  deleteStay: (id) => req('DELETE', `/api/stays/${id}`),
  // cidades
  createCity: (tripId, c) => req('POST', `/api/trips/${tripId}/cities`, c),
  updateCity: (id, patch) => req('PUT', `/api/cities/${id}`, patch),
  deleteCity: (id) => req('DELETE', `/api/cities/${id}`),
};
