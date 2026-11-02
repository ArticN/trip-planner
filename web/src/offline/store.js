// Armazenamento no aparelho: IndexedDB (sobrevive a fechar o app e a ficar sem internet).
// Interface mínima chave → valor; sem IndexedDB (aba anônima antiga, bloqueio do navegador) cai na memória
// e o app avisa que a cópia offline não fica guardada.
const DB = 'trip-planner';
const STORE = 'kv';

function memoryStore() {
  const m = new Map();
  return {
    kind: 'memory',
    get: async (k) => (m.has(k) ? structuredClone(m.get(k)) : undefined),
    set: async (k, v) => { m.set(k, structuredClone(v)); },
    del: async (k) => { m.delete(k); },
    keys: async (prefix = '') => [...m.keys()].filter((k) => k.startsWith(prefix)),
  };
}

function idbStore(db) {
  const tx = (mode, fn) => new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const r = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(r?.result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error || new Error('gravação cancelada'));
  });
  return {
    kind: 'idb',
    get: (k) => tx('readonly', (s) => s.get(k)),
    set: (k, v) => tx('readwrite', (s) => s.put(v, k)),
    del: (k) => tx('readwrite', (s) => s.delete(k)),
    keys: async (prefix = '') => {
      const all = await tx('readonly', (s) => s.getAllKeys(prefix ? IDBKeyRange.bound(prefix, `${prefix}￿`) : undefined));
      return (all || []).map(String);
    },
  };
}

export function openStore() {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(memoryStore());
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE); };
      req.onsuccess = () => resolve(idbStore(req.result));
      req.onerror = () => resolve(memoryStore());
      req.onblocked = () => resolve(memoryStore());
    } catch { resolve(memoryStore()); }
  });
}

export { memoryStore };
