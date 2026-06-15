/**
 * ZERO TRACE BOT v5.0 - YouTube Download
 * APIs : cobalt.tools v2 (primary) → yt5s → y2mate
 */
'use strict';
const axios = require('axios');

// ── Cobalt API v2 (nouveau format 2024+) ──────────────────────────────────────
async function tryCobaltV2(url, audioOnly = false) {
  const endpoints = [
    'https://api.cobalt.tools',
    'https://cobalt-api.nico.moe',
  ];
  for (const base of endpoints) {
    try {
      const res = await axios.post(`${base}/`,
        { url, videoQuality: '720', audioFormat: 'mp3', isAudioOnly: audioOnly, filenameStyle: 'basic' },
        { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, timeout: 20000 }
      );
      if (res.data?.url) return res.data.url;
      if (res.data?.tunnel) return res.data.tunnel;
    } catch (e) {}
  }
  return null;
}

// ── yt5s ─────────────────────────────────────────────────────────────────────
async function tryYt5s(url) {
  try {
    const vid = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
    if (!vid) return null;
    const res = await axios.post('https://yt5s.io/api/ajaxSearch',
      `q=https://www.youtube.com/watch?v=${vid}&vt=mp4`,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest' }, timeout: 15000 }
    );
    const links = res.data?.links?.mp4;
    if (links) {
      const entry = Object.values(links).find(v => v?.q?.includes('720')) || Object.values(links)[0];
      if (entry?.url) return entry.url;
    }
  } catch (e) {}
  return null;
}

// ── y2mate ────────────────────────────────────────────────────────────────────
async function tryY2mate(url) {
  try {
    const vid = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
    if (!vid) return null;
    const res1 = await axios.post('https://www.y2mate.com/mates/analyzeV2/ajax',
      `k_query=https://www.youtube.com/watch?v=${vid}&k_page=home&hl=fr&q_auto=1`,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 }
    );
    const links = res1.data?.links?.mp4;
    if (links) {
      const [, info] = Object.entries(links).find(([k]) => k === '720p') || Object.entries(links)[0] || [];
      if (info?.k) {
        const res2 = await axios.post('https://www.y2mate.com/mates/convertV2/index',
          `vid=${vid}&k=${info.k}`,
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
        );
        if (res2.data?.dlink) return res2.data.dlink;
      }
    }
  } catch (e) {}
  return null;
}

module.exports = {
  name: 'yt',
  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan } = ctx;
    const url = args[0];

    if (!url || !(url.includes('youtube.com') || url.includes('youtu.be'))) {
      await antiBan.safeSend(sock, jid, {
        text: '🎬 *.yt [lien YouTube]*\nEx : *.yt https://youtu.be/...*\n\n> *ZERO TRACE BOT v5.0*',
      }, { msgOptions: { quoted: msg } });
      return;
    }

    try {
      await sock.sendMessage(jid, { react: { text: '📥', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, { text: '📥 _Téléchargement YouTube..._' }, { msgOptions: { quoted: msg } });

      let dlUrl = await tryCobaltV2(url, false)
                || await tryYt5s(url)
                || await tryY2mate(url);

      if (!dlUrl) throw new Error('Toutes les APIs ont échoué. Vérifie que la vidéo est publique.');

      const vidRes = await axios.get(dlUrl, { responseType: 'arraybuffer', timeout: 90000, maxContentLength: 64 * 1024 * 1024 });
      const buf    = Buffer.from(vidRes.data);

      if (buf.length > 64 * 1024 * 1024) {
        await antiBan.safeSend(sock, jid, {
          text: `⚠️ Vidéo trop lourde (${Math.round(buf.length/1024/1024)}MB, max 64MB)\n🔗 Télécharge directement : ${dlUrl}`,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      await sock.sendMessage(jid, {
        video: buf, mimetype: 'video/mp4',
        caption: `🎬 *Vidéo YouTube*\n\n> *ZERO TRACE BOT v5.0*`,
      }, { quoted: msg });

      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});
    } catch (e) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, {
        text: `❌ *YouTube échoué*\n${e.message}`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};
