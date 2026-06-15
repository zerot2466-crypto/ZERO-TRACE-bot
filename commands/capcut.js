/**
 * ZERO TRACE BOT v5.0 — CapCut Download
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * API 1 : api.drexapp.space/downloader/capcut
 * API 2 : capcutdownloader.pro (fallback)
 * API 3 : ssdownloader.com/capcut (fallback)
 *
 * Télécharge les templates et vidéos CapCut sans filigrane
 * Commandes : .capcut [lien]
 */
'use strict';
const axios = require('axios');
const DREX  = 'https://api.drexapp.space';

async function downloadCapcut(url) {
  // ── API 1 : drexapp (principale) ───────────────────────────────────────
  try {
    const res = await axios.get(
      `${DREX}/downloader/capcut?url=${encodeURIComponent(url)}`,
      { timeout: 25000 }
    );
    const d = res.data;
    if (d?.status && d?.result) {
      const r = d.result;
      const dlUrl = r.video || r.downloadURL || r.url || r.noWatermark;
      if (dlUrl) {
        return {
          url:       dlUrl,
          title:     r.title    || r.name  || 'CapCut Video',
          author:    r.author   || r.creator || '',
          thumbnail: r.thumbnail || r.cover || null,
          duration:  r.duration  || '',
          likes:     r.likes     || r.like_count || '',
        };
      }
    }
  } catch (e) { console.log('[CAPCUT] drexapp échoué:', e.message); }

  // ── API 2 : capcutdownloader.pro ────────────────────────────────────────
  try {
    const res = await axios.post(
      'https://capcutdownloader.pro/api/download',
      { url },
      { headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 }
    );
    const d = res.data;
    if (d?.video || d?.downloadUrl) {
      return {
        url:       d.video || d.downloadUrl,
        title:     d.title     || 'CapCut Video',
        author:    d.author    || '',
        thumbnail: d.thumbnail || null,
        duration:  d.duration  || '',
        likes:     '',
      };
    }
  } catch (e) {}

  // ── API 3 : capcut via cobalt ───────────────────────────────────────────
  try {
    for (const base of ['https://api.cobalt.tools', 'https://cobalt-api.nico.moe']) {
      const res = await axios.post(`${base}/`,
        { url, filenameStyle: 'basic' },
        { headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, timeout: 20000 }
      );
      const dlUrl = res.data?.url || res.data?.tunnel;
      if (dlUrl) return { url: dlUrl, title: 'CapCut Video', author: '', thumbnail: null, duration: '', likes: '' };
    }
  } catch (e) {}

  throw new Error('Impossible de télécharger. Assure-toi que le lien CapCut est valide et public.');
}

module.exports = {
  name:    'capcut',
  aliases: ['cc', 'capcutdl'],
  description: 'Télécharger une vidéo CapCut sans filigrane',
  usage:   '.capcut [lien CapCut]',
  category: 'media',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan } = ctx;
    const url = args[0];

    if (!url || !(url.includes('capcut') || url.includes('capcut.com'))) {
      await antiBan.safeSend(sock, jid, {
        text:
          `✂️ *.capcut [lien]*\n\n` +
          `Ex : *.capcut https://www.capcut.com/t/...*\n\n` +
          `✅ Téléchargement *sans filigrane*\n` +
          `✅ Templates & vidéos\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    try {
      await sock.sendMessage(jid, { react: { text: '✂️', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, { text: '✂️ _Téléchargement CapCut en cours..._' }, { msgOptions: { quoted: msg } });

      const data = await downloadCapcut(url);

      const res = await axios.get(data.url, {
        responseType: 'arraybuffer',
        timeout: 90000,
        maxContentLength: 64 * 1024 * 1024,
      });
      const buf = Buffer.from(res.data);

      const caption =
        `✂️ *${data.title}*\n` +
        (data.author   ? `👤 *Créateur :* ${data.author}\n`  : '') +
        (data.duration ? `⏱️ *Durée :* ${data.duration}\n`   : '') +
        (data.likes    ? `❤️ *Likes :* ${data.likes}\n`      : '') +
        `\n🚫 _Sans filigrane_\n\n` +
        `> *ZERO TRACE BOT v5.0*`;

      // Envoyer la thumbnail d'abord si disponible
      if (data.thumbnail) {
        try {
          const thumbRes = await axios.get(data.thumbnail, { responseType: 'arraybuffer', timeout: 10000 });
          await sock.sendMessage(jid, { image: Buffer.from(thumbRes.data), caption: `✂️ *${data.title}*` }, { quoted: msg });
        } catch (e) {}
      }

      await sock.sendMessage(jid, {
        video: buf,
        caption,
        mimetype: 'video/mp4',
      }, { quoted: msg });

      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});

    } catch (err) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, {
        text:
          `❌ Erreur CapCut : ${err.message}\n\n` +
          `💡 Le lien doit être public et commencer par\n_https://www.capcut.com/t/..._\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};
