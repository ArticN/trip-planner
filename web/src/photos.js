// Fotos do diário: data em que a foto foi tirada (EXIF) e redução no próprio aparelho antes de enviar.
// Uma foto de celular tem 3 a 12 MB; aqui vira um JPEG de até 2048 px (uns 400 KB a 1 MB) e uma miniatura de 720 px.

const FULL_SIDE = 2048;
const THUMB_SIDE = 720;
const MAX_BYTES = 3.5 * 1024 * 1024; // foto + miniatura precisam caber nos 4 MB por envio do servidor

// "2026:11:06 14:32:10" do EXIF (DateTimeOriginal, ou DateTime) → "2026-11-06T14:32:10"; só JPEG traz isso legível
export async function exifDate(file) {
  try {
    const buf = await file.slice(0, 256 * 1024).arrayBuffer();
    const v = new DataView(buf);
    if (v.getUint16(0) !== 0xffd8) return null;
    let p = 2;
    while (p + 4 < v.byteLength) {
      const marker = v.getUint16(p);
      const len = v.getUint16(p + 2);
      if (marker === 0xffe1 && v.getUint32(p + 4) === 0x45786966) return readTiff(v, p + 10);
      if ((marker & 0xff00) !== 0xff00 || marker === 0xffda) return null;
      p += 2 + len;
    }
  } catch { /* arquivo sem EXIF legível */ }
  return null;
}

function readTiff(v, t) {
  const le = v.getUint16(t) === 0x4949;
  const u16 = (o) => v.getUint16(t + o, le);
  const u32 = (o) => v.getUint32(t + o, le);
  const ascii = (o, n) => { let s = ''; for (let i = 0; i < n - 1; i++) s += String.fromCharCode(v.getUint8(t + o + i)); return s; };
  const tags = (ifd) => {
    const out = {};
    const n = u16(ifd);
    for (let i = 0; i < n; i++) {
      const e = ifd + 2 + i * 12;
      out[u16(e)] = { count: u32(e + 4), at: e + 8 };
    }
    return out;
  };
  const ifd0 = tags(u32(4));
  let dt = null;
  if (ifd0[0x8769]) {
    const exif = tags(u32(ifd0[0x8769].at));
    const d = exif[0x9003] || exif[0x9004];
    if (d) dt = ascii(u32(d.at), d.count);
  }
  if (!dt && ifd0[0x0132]) dt = ascii(u32(ifd0[0x0132].at), ifd0[0x0132].count);
  const m = dt && dt.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
  return m && m[1] !== '0000' ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}` : null;
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

// prepara uma foto para o diário: { thumb, full, w, h, taken }
export async function preparePhoto(file) {
  if (!/^image\//.test(file.type) && !/\.(jpe?g|png|webp|heic|heif|avif|gif)$/i.test(file.name)) throw new Error('não é uma foto');
  const taken = (await exifDate(file)) || localStamp(file.lastModified || Date.now());
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
    return { thumb: thumb.blob, full: full.blob, w: full.w, h: full.h, taken };
  } finally { img.close?.(); }
}
