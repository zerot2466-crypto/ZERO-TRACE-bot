/**
 * ZERO TRACE BOT v5.0 - TikTok Download
 * APIs : tikwm.com (primary) → cobalt v2 → snaptik
 */
'use strict';
const axios = require('axios');

async function downloadTikTok(url) {
  // API 1 : tikwm.com (très fiable, gratuit)
  try {
    const res = await axios.get(`https://tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`, { timeout: 15000 });
    const d   = res.data?.data;
    if (d?.play) return { url: d.hdplay || d.play, title: d.title || 'TikTok', author: d.author?.nickname || '' };
  } catch (e) {}

  // API 2 : cobalt.tools v2
  try {
    const endpoints = ['https://api.cobalt.tools', 'https://cobalt-api.nico.moe'];
    for (const base of endpoints) {
      const res = await axios.post(`${base}/`,
        { url, videoQuality: '1080', filenameStyle: 'basic' },
        { headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, timeout: 15000 }
      );
      const dlUrl = res.data?.url || res.data?.tunnel;
      if (dlUrl) return { url: dlUrl, title: 'TikTok', author: '' };
    }
  } catch (e) {}

  // API 3 : musicaldown
  try {
    const res = await axios.get(`https://musicaldown.com/api?url=${encodeURIComponent(url)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000
    });
    if (res.data?.video) return { url: res.data.video, title: res.data.title || 'TikTok', author: '' };
  } catch (e) {}

  throw new Error('Toutes les APIs TikTok ont échoué. Vérifie que le lien est public.');
}

module.exports = {
  name: 'tiktok',
  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan } = ctx;
    const url = args[0];

    if (!url || !(url.includes('tiktok') || url.includes('vm.tiktok') || url.includes('vt.tiktok'))) {
      await antiBan.safeSend(sock, jid, {
        text: '🎵 *.tiktok [lien]*\nEx : *.tiktok https://vm.tiktok.com/...*\n\n> *ZERO TRACE BOT v5.0*',
      }, { msgOptions: { quoted: msg } });
      return;
    }

    try {
      await sock.sendMessage(jid, { react: { text: '📥', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, { text: '📥 _Téléchargement TikTok..._' }, { msgOptions: { quoted: msg } });

      const data   = await downloadTikTok(url);
      const vidRes = await axios.get(data.url, { responseType: 'arraybuffer', timeout: 60000, maxContentLength: 64 * 1024 * 1024 });
      const buf    = Buffer.from(vidRes.data);

      if (buf.length > 64 * 1024 * 1024) {
        await antiBan.safeSend(sock, jid, {
          text: `⚠️ Vidéo trop lourde (${Math.round(buf.length/1024/1024)}MB)\n🔗 Lien direct : ${data.url}`,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      await sock.sendMessage(jid, {
        video: buf, mimetype: 'video/mp4',
        caption: `🎵 *${(data.title || 'TikTok').slice(0, 80)}*${data.author ? `\n👤 @${data.author}` : ''}\n\n> *ZERO TRACE BOT v5.0*`,
      }, { quoted: msg });

      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});
    } catch (e) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, {
        text: `❌ *TikTok échoué*\n${e.message}`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};
