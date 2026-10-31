// Fotos do diário: data em que a foto foi tirada (EXIF) e redução no próprio aparelho antes de enviar.
// Uma foto de celular tem 3 a 12 MB; aqui vira um JPEG de até 2048 px (uns 400 KB a 1 MB) e uma miniatura de 720 px.

const FULL_SIDE = 2048;
const THUMB_SIDE = 720;
const MAX_BYTES = 3.5 * 1024 * 1024; // foto + miniatura precisam caber nos 4 MB por envio do servidor

// metadados que o celular grava na foto (EXIF; só JPEG traz isso legível no navegador):
// quando foi tirada, onde (GPS) e com o quê (câmera, lente, abertura, velocidade, ISO, distância focal)
export async function readExif(file) {
  try {
    const buf = await file.slice(0, 256 * 1024).arrayBuffer();
    const v = new DataView(buf);
    if (v.getUint16(0) !== 0xffd8) return {};
    let p = 2;
    while (p + 4 < v.byteLength) {
      const marker = v.getUint16(p);
      const len = v.getUint16(p + 2);
      if (marker === 0xffe1 && v.getUint32(p + 4) === 0x45786966) return readTiff(v, p + 10);
      if ((marker & 0xff00) !== 0xff00 || marker === 0xffda) return {};
      p += 2 + len;
    }
  } catch { /* arquivo sem EXIF legível */ }
  return {};
}

const SIZES = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };
function readTiff(v, t) {
  const le = v.getUint16(t) === 0x4949;
  const u16 = (o) => v.getUint16(t + o, le);
  const u32 = (o) => v.getUint32(t + o, le);
  const i32 = (o) => v.getInt32(t + o, le);
  // lê uma pasta (IFD) do EXIF: { tag: valor }, com números, textos e frações já convertidos
  const ifd = (at) => {
    const out = {};
    if (!at || t + at + 2 > v.byteLength) return out;
    const n = u16(at);
    for (let i = 0; i < n; i++) {
      const e = at + 2 + i * 12;
      if (t + e + 12 > v.byteLength) break;
      const tag = u16(e);
      const type = u16(e + 2);
      const count = u32(e + 4);
      const size = (SIZES[type] || 1) * count;
      const off = size <= 4 ? e + 8 : u32(e + 8);
      if (t + off + size > v.byteLength) continue;
      const one = (k) => {
        const o = off + k * (SIZES[type] || 1);
        if (type === 3) return u16(o);
        if (type === 4) return u32(o);
        if (type === 9) return i32(o);
        if (type === 5) return u32(o + 4) ? u32(o) / u32(o + 4) : 0;
        if (type === 10) return i32(o + 4) ? i32(o) / i32(o + 4) : 0;
        return v.getUint8(t + o);
      };
      if (type === 2) {
        let s = '';
        for (let k = 0; k < count; k++) { const c = v.getUint8(t + off + k); if (!c) break; s += String.fromCharCode(c); }
        out[tag] = s.trim();
      } else out[tag] = count === 1 ? one(0) : Array.from({ length: Math.min(count, 8) }, (_, k) => one(k));
    }
    return out;
  };
  const i0 = ifd(u32(4));
  const ex = ifd(i0[0x8769]);
  const gps = ifd(i0[0x8825]);
  const dt = ex[0x9003] || ex[0x9004] || i0[0x0132];
  const m = typeof dt === 'string' && dt.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
  const deg = (a, ref) => (Array.isArray(a) && a.length >= 3 ? (a[0] + a[1] / 60 + a[2] / 3600) * (/[SW]/.test(ref || '') ? -1 : 1) : null);
  let lat = deg(gps[2], gps[1]);
  let lng = deg(gps[4], gps[3]);
  if (lat === 0 && lng === 0) { lat = null; lng = null; } // celular sem sinal de GPS grava 0,0
  const r = (x, d = 1) => (typeof x === 'number' && Number.isFinite(x) && x > 0 ? Math.round(x * 10 ** d) / 10 ** d : null);
  return {
    taken: m && m[1] !== '0000' ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}` : null,
    lat: lat != null && Math.abs(lat) <= 90 ? Math.round(lat * 1e6) / 1e6 : null,
    lng: lng != null && Math.abs(lng) <= 180 ? Math.round(lng * 1e6) / 1e6 : null,
    meta: Object.fromEntries(Object.entries({
      make: i0[0x010f], model: i0[0x0110], lens: ex[0xa434],
      f: r(ex[0x829d]), exp: typeof ex[0x829a] === 'number' && ex[0x829a] > 0 ? ex[0x829a] : null,
      iso: Array.isArray(ex[0x8827]) ? ex[0x8827][0] : ex[0x8827] || null, focal: r(ex[0x920a]), focal35: ex[0xa405] || null,
      alt: typeof gps[6] === 'number' ? Math.round(gps[6]) : null,
    }).filter(([, x]) => x != null && x !== '')),
  };
}

// sem EXIF: a data de modificação do arquivo, no fuso do aparelho
const localStamp = (ms) => {
  const d = new Date(ms);
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`;
};

async function decode(file) {
  // createImageBitmap já gira a foto conforme o EXIF; o <img> é o plano B (Safari antigo)
  if (window.createImageBitmap) {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { /* tenta com <img> */ }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => fail(new Error('formato não suportado')); i.src = url; });
  } finally { setTimeout(() => URL.revokeObjectURL(url), 0); }
}

const toJpeg = (img, side, q) => {
  const w0 = img.width;
  const h0 = img.height;
  const k = Math.min(1, side / Math.max(w0, h0));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w0 * k));
  c.height = Math.max(1, Math.round(h0 * k));
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; // PNG com transparência ganha fundo branco, como papel fotográfico
  g.fillRect(0, 0, c.width, c.height);
  g.drawImage(img, 0, 0, c.width, c.height);
  return new Promise((ok, fail) => c.toBlob((b) => (b ? ok({ blob: b, w: c.width, h: c.height }) : fail(new Error('não consegui reduzir a foto'))), 'image/jpeg', q));
};

// prepara uma foto para o diário: { thumb, full, w, h, taken, lat, lng, meta }
export async function preparePhoto(file) {
  if (!/^image\//.test(file.type) && !/\.(jpe?g|png|webp|heic|heif|avif|gif)$/i.test(file.name)) throw new Error('não é uma foto');
  const exif = await readExif(file);
  const taken = exif.taken || localStamp(file.lastModified || Date.now());
  let img;
  try { img = await decode(file); } catch {
    throw new Error(/hei[cf]$/i.test(file.name) ? 'este navegador não abre HEIC; no iPhone, envie pelo Safari ou exporte como JPEG' : 'formato não suportado');
  }
  try {
    let full;
    for (const [side, q] of [[FULL_SIDE, 0.85], [FULL_SIDE, 0.75], [1600, 0.75], [1280, 0.7]]) {
      full = await toJpeg(img, side, q);
      if (full.blob.size <= MAX_BYTES) break;
    }
    const thumb = await toJpeg(img, THUMB_SIDE, 0.78);
    // a foto reduzida sai sem EXIF (o canvas não copia); local e câmera vão à parte, só o que o app usa
    return { thumb: thumb.blob, full: full.blob, w: full.w, h: full.h, taken, lat: exif.lat ?? null, lng: exif.lng ?? null, meta: { ...(exif.meta || {}), ow: img.width, oh: img.height, ...(exif.taken ? {} : { noexif: 1 }) } };
  } finally { img.close?.(); }
}
