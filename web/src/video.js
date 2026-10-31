// Vídeos do álbum: o arquivo fica numa plataforma de vídeo e o álbum guarda só o endereço curto dele
// (plataforma + código). O player da plataforma só carrega quando a pessoa toca no ▶.

export const PLATFORMS = {
  yt: { name: 'YouTube', color: '#e62117' },
  vimeo: { name: 'Vimeo', color: '#1ab7ea' },
  drive: { name: 'Google Drive', color: '#1fa463' },
  ig: { name: 'Instagram', color: '#d62976' },
  tiktok: { name: 'TikTok', color: '#fe2c55' },
};

// link colado → { src, vid, vertical? }; null se não reconhecer.
// Links curtos do TikTok (vt.tiktok.com) voltam como { short } para o servidor descobrir o endereço completo.
export function parseVideo(text) {
  const s = String(text || '').trim();
  let m;
  if ((m = s.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{11})/i))) {
    return { src: 'yt', vid: m[1], vertical: /\/shorts\//i.test(s) };
  }
  if ((m = s.match(/vimeo\.com\/(?:.*\/)?(?:video\/)?(\d{6,12})(?:\/([0-9a-f]{6,20}))?/i))) {
    const h = m[2] || (s.match(/[?&]h=([0-9a-f]{6,20})/i) || [])[1];
    return { src: 'vimeo', vid: h ? `${m[1]}/${h}` : m[1] };
  }
  if ((m = s.match(/drive\.google\.com\/(?:file\/d\/|open\?(?:.*&)?id=|uc\?(?:.*&)?id=)([\w-]{20,80})/i))) {
    return { src: 'drive', vid: m[1] };
  }
  if ((m = s.match(/instagram\.com\/(?:[\w.]+\/)?(?:reels?|p|tv)\/([\w-]{5,40})/i))) {
    return { src: 'ig', vid: m[1], vertical: true };
  }
  if ((m = s.match(/tiktok\.com\/(?:@[\w.-]+\/video|embed(?:\/v2)?|v)\/(\d{10,25})/i))) {
    return { src: 'tiktok', vid: m[1], vertical: true };
  }
  if (/^https?:\/\/(?:vt|vm)\.tiktok\.com\/[\w-]+/i.test(s)) return { short: s };
  return null;
}

export const videoOf = (b) => (b.src && b.vid && PLATFORMS[b.src] ? { src: b.src, vid: b.vid } : null);

export function embedUrl({ src, vid }) {
  if (src === 'yt') return `https://www.youtube-nocookie.com/embed/${vid}?autoplay=1&rel=0&playsinline=1&modestbranding=1`;
  if (src === 'vimeo') { const [id, h] = vid.split('/'); return `https://player.vimeo.com/video/${id}?autoplay=1${h ? `&h=${h}` : ''}`; }
  if (src === 'drive') return `https://drive.google.com/file/d/${vid}/preview`;
  if (src === 'ig') return `https://www.instagram.com/p/${vid}/embed/`;
  if (src === 'tiktok') return `https://www.tiktok.com/embed/v2/${vid}`;
  return null;
}

export function pageUrl({ src, vid }) {
  if (src === 'yt') return `https://youtu.be/${vid}`;
  if (src === 'vimeo') return `https://vimeo.com/${vid}`;
  if (src === 'drive') return `https://drive.google.com/file/d/${vid}/view`;
  if (src === 'ig') return `https://www.instagram.com/p/${vid}/`;
  if (src === 'tiktok') return `https://www.tiktok.com/embed/v2/${vid}`;
  return null;
}

// capa: só YouTube e Drive têm imagem pública sem chave; as outras usam a cor da plataforma
export function coverUrls({ src, vid }, vertical) {
  if (src === 'yt') return [`https://i.ytimg.com/vi/${vid}/${vertical ? 'oar2' : 'hqdefault'}.jpg`, `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`];
  if (src === 'drive') return [`https://drive.google.com/thumbnail?id=${vid}&sz=w1000`];
  return [];
}
