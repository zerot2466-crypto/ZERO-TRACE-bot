/**
 * ZERO TRACE BOT v5.0 — .ss (Screenshot web)
 * ✅ Multi-API avec fallback automatique
 *   1. ScreenshotMachine (sans clé)
 *   2. Pikwy (sans clé)
 *   3. Thum.io (sans clé)
 *   4. Miniature.io (sans clé)
 */
'use strict';

const axios = require('axios');

const THEMES  = ['light', 'dark'];
const DEVICES = ['desktop', 'mobile', 'tablet'];

async function tryScreenshotMachine(url, device) {
  const dimension = device === 'mobile' ? '375x667' : '1280x800';
  const apiUrl = `https://api.screenshotmachine.com/?url=${encodeURIComponent(url)}&dimension=${dimension}&format=jpg&delay=2000`;
  const res = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 35000, headers: { accept: 'image/*' } });
  if (!res.data || res.data.byteLength < 1000) throw new Error('Image vide');
  return Buffer.from(res.data);
}

async function tryPikwy(url) {
  const apiUrl = `https://api.pikwy.com/?tkn=free&u=${encodeURIComponent(url)}&w=1280&h=800&f=jpg&t=3`;
  const res = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 35000, headers: { accept: 'image/*' } });
  if (!res.data || res.data.byteLength < 1000) throw new Error('Image vide');
  return Buffer.from(res.data);
}

async function tryThumio(url) {
  const apiUrl = `https://image.thum.io/get/width/1280/crop/800/noanimate/${encodeURIComponent(url)}`;
  const res = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 35000, headers: { accept: 'image/*', 'User-Agent': 'Mozilla/5.0' } });
  if (!res.data || res.data.byteLength < 1000) throw new Error('Image vide');
  return Buffer.from(res.data);
}

async function tryMiniature(url) {
  const apiUrl = `https://miniature.io/?url=${encodeURIComponent(url)}&width=1280&height=800`;
  const res = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 35000, headers: { accept: 'image/*' } });
  if (!res.data || res.data.byteLength < 1000) throw new Error('Image vide');
  return Buffer.from(res.data);
}

async function captureScreenshot(url, device) {
  const attempts = [
    { name: 'ScreenshotMachine', fn: () => tryScreenshotMachine(url, device) },
    { name: 'Pikwy',             fn: () => tryPikwy(url) },
    { name: 'Thum.io',          fn: () => tryThumio(url) },
    { name: 'Miniature.io',     fn: () => tryMiniature(url) },
  ];
  let lastErr = null;
  for (const a of attempts) {
    try {
      console.log(`[SS] Essai ${a.name}...`);
      const buf = await a.fn();
      console.log(`[SS] OK ${a.name} — ${buf.byteLength} bytes`);
      return { buffer: buf, provider: a.name };
    } catch (e) {
      console.log(`[SS] X ${a.name}: ${e.message}`);
      lastErr = e;
    }
  }
  throw new Error(`Tous les services ont echoue. Dernier: ${lastErr?.message}`);
}

module.exports = {
  name:     'ss',
  aliases:  ['ssweb', 'screenshot', 'capture'],
  description: "Prendre une capture d'ecran d'un site web",
  usage:    '.ss [url] | .ss [url] dark | .ss [url] mobile',
  category: 'outils',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan } = ctx;

    if (!args.length || !args[0]) {
      await antiBan.safeSend(sock, jid, {
        text:
          '📸 *.ss [url]*\n\n' +
          "Prend une capture d'ecran d'un site web.\n\n" +
          'Exemples :\n' +
          '  *.ss https://google.com*\n' +
          '  *.ss https://github.com dark*\n' +
          '  *.ss https://youtube.com mobile*\n\n' +
          '🎨 Themes : `light` (defaut) · `dark`\n' +
          '📱 Appareils : `desktop` (defaut) · `mobile` · `tablet`\n\n' +
          '> *ZERO TRACE BOT v5.0*',
      }, { msgOptions: { quoted: msg } });
      return;
    }

    let url    = args[0];
    let theme  = 'light';
    let device = 'desktop';

    for (let i = 1; i < args.length; i++) {
      const a = args[i].toLowerCase();
      if (THEMES.includes(a))  theme  = a;
      if (DEVICES.includes(a)) device = a;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;

    try { new URL(url); } catch {
      await antiBan.safeSend(sock, jid, {
        text: '❌ URL invalide : `' + url + '`\n\nAssure-toi d\'inclure *https://*\n\n> *ZERO TRACE BOT v5.0*',
      }, { msgOptions: { quoted: msg } });
      return;
    }

    await sock.sendMessage(jid, { react: { text: '📸', key: msg.key } }).catch(() => {});
    await antiBan.safeSend(sock, jid, {
      text: '📸 _Capture de_ ' + url + '...',
    }, { msgOptions: { quoted: msg } });

    try {
      const { buffer, provider } = await captureScreenshot(url, device);

      await sock.sendMessage(jid, {
        image:    buffer,
        caption:  '📸 *Screenshot* · _' + provider + '_\n🔗 ' + url + '\n📱 ' + device + '\n\n> *ZERO TRACE BOT v5.0*',
        mimetype: 'image/jpeg',
      }, { quoted: msg });

      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});

    } catch (err) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      console.error('[SS] Erreur finale:', err.message);
      await antiBan.safeSend(sock, jid, {
        text:
          '❌ *Screenshot echoue*\n\n' +
          "Impossible de capturer ce site.\n" +
          "Verifie que l'URL est accessible.\n\n" +
          '> *ZERO TRACE BOT v5.0*',
      }, { msgOptions: { quoted: msg } });
    }
  },
};
