/**
 * ZERO TRACE BOT v5.0 — Instagram Download (v2)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * API 1 : api.drexapp.space/downloader/igdlv2  ← NOUVELLE
 * API 2 : cobalt.tools v2
 * API 3 : saveig.app
 * API 4 : igdownloader.app
 */
'use strict';
const axios = require('axios');
const DREX  = 'https://api.drexapp.space';

async function downloadInstagram(url) {
  const cleanUrl = url.split('?')[0].trim();

  // ── API 1 : drexapp igdlv2 (nouvelle, prioritaire) ─────────────────────
  try {
    const res = await axios.get(`${DREX}/downloader/igdlv2?url=${encodeURIComponent(cleanUrl)}`, { timeout: 20000 });
    const d   = res.data;
    if (d?.status && d?.result) {
      const r = d.result;
      // Supporte vidéo unique, image unique, et carousel
      if (r.video)   return { url: r.video,        type: 'video', caption: r.caption || '' };
      if (r.image)   return { url: r.image,        type: 'image', caption: r.caption || '' };
      if (r.items?.length) {
        // Carousel → on prend le premier item
        const first = r.items[0];
        return {
          url:     first.video || first.image,
          type:    first.video ? 'video' : 'image',
          caption: r.caption || '',
          count:   r.items.length,
          items:   r.items,
        };
      }
    }
  } catch (e) { console.log('[IG] drexapp échoué:', e.message); }

  // ── API 2 : cobalt.tools v2 ─────────────────────────────────────────────
  for (const base of ['https://api.cobalt.tools', 'https://cobalt-api.nico.moe']) {
    try {
      const res = await axios.post(`${base}/`,
        { url: cleanUrl, filenameStyle: 'basic' },
        { headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, timeout: 20000 }
      );
      const dlUrl = res.data?.url || res.data?.tunnel;
      if (dlUrl) {
        const type = res.data?.filename?.includes('.mp4') || cleanUrl.includes('/reel/') ? 'video' : 'image';
        return { url: dlUrl, type, caption: '' };
      }
      if (res.data?.picker?.[0]?.url) return { url: res.data.picker[0].url, type: 'video', caption: '' };
    } catch (e) {}
  }

  // ── API 3 : saveig.app ──────────────────────────────────────────────────
  try {
    const res = await axios.get(
      `https://v3.saveig.app/api/ajaxSearch?q=${encodeURIComponent(cleanUrl)}&t=media&lang=fr`,
      { headers: { 'User-Agent': 'Mozilla/5.0', 'X-Requested-With': 'XMLHttpRequest' }, timeout: 15000 }
    );
    const html = res.data?.data || '';
    const m    = html.match(/href="(https:\/\/[^"]+\.mp4[^"]*)"/);
    if (m) return { url: m[1], type: 'video', caption: '' };
    const img  = html.match(/href="(https:\/\/[^"]+\.(jpg|jpeg|png)[^"]*)"/);
    if (img) return { url: img[1], type: 'image', caption: '' };
  } catch (e) {}

  throw new Error('Impossible de télécharger. Vérifie que le compte est public.');
}

module.exports = {
  name: 'instagram',
  aliases: ['ig', 'insta', 'reel'],
  description: 'Télécharger un reel, une photo ou un carousel Instagram',
  usage: '.instagram [lien]',
  category: 'media',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan } = ctx;
    const url = args[0];

    if (!url || !url.includes('instagram')) {
      await antiBan.safeSend(sock, jid, {
        text:
          `📸 *.instagram [lien]*\n` +
          `Ex : *.instagram https://www.instagram.com/reel/...*\n\n` +
          `✅ Supporte : Reels · Photos · Carousels\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    try {
      await sock.sendMessage(jid, { react: { text: '📥', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, { text: '📸 _Téléchargement Instagram..._' }, { msgOptions: { quoted: msg } });

      const data = await downloadInstagram(url);

      // Carousel multi-items
      if (data.items?.length > 1) {
        await antiBan.safeSend(sock, jid, {
          text: `📸 *Carousel détecté* — ${data.items.length} médias\n_Envoi en cours..._`,
        }, { msgOptions: { quoted: msg } });

        for (let i = 0; i < Math.min(data.items.length, 5); i++) {
          const item = data.items[i];
          const itemUrl = item.video || item.image;
          try {
            const res = await axios.get(itemUrl, { responseType: 'arraybuffer', timeout: 60000 });
            const buf = Buffer.from(res.data);
            if (item.video) {
              await sock.sendMessage(jid, { video: buf, caption: `[${i + 1}/${data.items.length}]`, mimetype: 'video/mp4' });
            } else {
              await sock.sendMessage(jid, { image: buf, caption: `[${i + 1}/${data.items.length}]` });
            }
          } catch (e) {}
        }
        await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});
        return;
      }

      const res = await axios.get(data.url, { responseType: 'arraybuffer', timeout: 60000, maxContentLength: 64 * 1024 * 1024 });
      const buf = Buffer.from(res.data);

      const caption = (data.caption ? `📝 ${data.caption.slice(0, 200)}\n\n` : '') + `> *ZERO TRACE BOT v5.0*`;

      if (data.type === 'video') {
        await sock.sendMessage(jid, { video: buf, caption, mimetype: 'video/mp4' }, { quoted: msg });
      } else {
        await sock.sendMessage(jid, { image: buf, caption }, { quoted: msg });
      }

      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});

    } catch (err) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, {
        text: `❌ Erreur Instagram : ${err.message}\n\n💡 Assure-toi que le compte est public.\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};
