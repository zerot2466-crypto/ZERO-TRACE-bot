/**
 * ZERO TRACE BOT v5.0 — .twitter / .x
 * Télécharge une vidéo Twitter/X
 */
'use strict';
const fetch = require('node-fetch');

module.exports = {
  name: 'twitter',
  description: 'Télécharge une vidéo Twitter/X',
  usage: '.twitter [URL tweet] | .x [URL tweet]',
  category: 'media',
  async execute(ctx) {
    const { sock, jid, msg, args, antiBan } = ctx;
    const url = args[0];
    if (!url || (!url.includes('twitter.com') && !url.includes('x.com') && !url.includes('t.co'))) {
      await antiBan.safeSend(sock, jid, { text: '❌ Fournis un lien Twitter/X valide.\nEx: *.twitter https://x.com/user/status/...*' }, { msgOptions: { quoted: msg } });
      return;
    }
    await antiBan.safeSend(sock, jid, { text: '🐦 _Téléchargement Twitter/X..._' }, { msgOptions: { quoted: msg } });
    try {
      // API twitsave (publique)
      const apiUrl = `https://twitsave.com/info?url=${encodeURIComponent(url)}`;
      const res    = await fetch(apiUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html   = await res.text();
      // Chercher l'URL mp4
      const match  = html.match(/https:\/\/video\.twimg\.com[^"' ]+\.mp4[^"' ]*/);
      if (!match) throw new Error('Vidéo non trouvée ou tweet sans vidéo');
      const vidUrl  = match[0];
      const vidRes  = await fetch(vidUrl);
      const buffer  = Buffer.from(await vidRes.arrayBuffer());
      await sock.sendMessage(jid, {
        video: buffer,
        caption: `🐦 *TWITTER / X*\n${url}\n\n> _ZERO TRACE 😈_`,
      }, { quoted: msg });
    } catch (e) {
      await antiBan.safeSend(sock, jid, { text: `❌ Impossible de télécharger.\nLe tweet doit être public et contenir une vidéo.\n_${e.message}_` }, { msgOptions: { quoted: msg } });
    }
  },
};
