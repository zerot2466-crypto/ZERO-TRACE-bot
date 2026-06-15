/**
 * ZERO TRACE BOT v5.0 — .pinterest
 * Télécharge une image/vidéo Pinterest
 */
'use strict';
const fetch = require('node-fetch');

module.exports = {
  name: 'pinterest',
  description: 'Télécharge une image Pinterest',
  usage: '.pinterest [URL Pinterest]',
  category: 'media',
  async execute(ctx) {
    const { sock, jid, msg, args, antiBan } = ctx;
    const url = args[0];
    if (!url || !url.includes('pin')) {
      await antiBan.safeSend(sock, jid, { text: '❌ Fournis un lien Pinterest.\nEx: *.pinterest https://pin.it/xxxxx*' }, { msgOptions: { quoted: msg } });
      return;
    }
    await antiBan.safeSend(sock, jid, { text: '📌 _Téléchargement Pinterest..._' }, { msgOptions: { quoted: msg } });
    try {
      // API publique Pinterest oEmbed
      const apiUrl = `https://www.pinterest.com/oembed.json?url=${encodeURIComponent(url)}`;
      const res  = await fetch(apiUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const data = await res.json();
      // Extraire l'URL de l'image depuis le HTML oEmbed
      const imgMatch = data.html?.match(/src="(https:\/\/i\.pinimg\.com[^"]+)"/);
      const imgUrl   = imgMatch?.[1] || data.thumbnail_url;
      if (!imgUrl) throw new Error('Image non trouvée');
      const imgRes  = await fetch(imgUrl);
      const buffer  = Buffer.from(await imgRes.arrayBuffer());
      await sock.sendMessage(jid, {
        image: buffer,
        caption: `📌 *PINTEREST*\n${data.title || ''}\n\n> _ZERO TRACE 😈_`,
      }, { quoted: msg });
    } catch (e) {
      await antiBan.safeSend(sock, jid, { text: `❌ Impossible de télécharger.\nVérifie que le lien est public.\n_${e.message}_` }, { msgOptions: { quoted: msg } });
    }
  },
};
