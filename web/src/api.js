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
  trip: () => req('GET', '/api/trip'),
  saveTrip: (patch) => req('PUT', '/api/trip', patch),
  createActivity: (a) => req('POST', '/api/activities', a),
  updateActivity: (id, patch) => req('PUT', `/api/activities/${id}`, patch),
  deleteActivity: (id) => req('DELETE', `/api/activities/${id}`),
  reorderDay: (day, ids) => req('PUT', '/api/days/reorder', { day, ids }),
  updateStay: (id, patch) => req('PUT', `/api/stays/${id}`, patch),
  importAll: (data) => req('POST', '/api/import', data),
  reset: () => req('POST', '/api/reset'),
};
