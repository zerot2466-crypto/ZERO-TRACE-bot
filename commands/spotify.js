/**
 * ZERO TRACE BOT v5.0 — .spotify
 * Infos + preview d'un titre Spotify
 */
'use strict';
const fetch = require('node-fetch');

module.exports = {
  name: 'spotify',
  description: "Récupère les infos et preview d'un titre Spotify",
  usage: '.spotify [URL ou nom du titre]',
  category: 'media',
  async execute(ctx) {
    const { sock, jid, msg, args, antiBan } = ctx;
    const query = args.join(' ');
    if (!query) { await antiBan.safeSend(sock, jid, { text: '❌ Usage : *.spotify [URL ou nom du titre]*' }, { msgOptions: { quoted: msg } }); return; }
    await antiBan.safeSend(sock, jid, { text: '🎵 _Recherche Spotify..._' }, { msgOptions: { quoted: msg } });
    try {
      // Utilise l'API oEmbed Spotify + recherche open
      let trackUrl = query;
      if (!query.includes('spotify.com')) {
        // Recherche via API ouverte
        const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`, {
          headers: { 'Authorization': 'Bearer ' + await getSpotifyToken() }
        });
        const searchData = await searchRes.json();
        const track = searchData?.tracks?.items?.[0];
        if (!track) throw new Error('Titre non trouvé');
        const artists = track.artists.map(a => a.name).join(', ');
        const album   = track.album.name;
        const imgUrl  = track.album.images?.[0]?.url;
        const preview = track.preview_url;
        const dur     = Math.floor(track.duration_ms / 1000);
        const min     = Math.floor(dur / 60);
        const sec     = dur % 60;

        const caption = `🎵 *${track.name}*\n👤 Artiste : *${artists}*\n💿 Album : *${album}*\n⏱️ Durée : *${min}:${sec.toString().padStart(2,'0')}*\n🔗 ${track.external_urls.spotify}\n\n> _ZERO TRACE 😈_`;
        if (imgUrl) {
          const imgRes = await fetch(imgUrl);
          const buf    = Buffer.from(await imgRes.arrayBuffer());
          await sock.sendMessage(jid, { image: buf, caption }, { quoted: msg });
        } else {
          await antiBan.safeSend(sock, jid, { text: caption }, { msgOptions: { quoted: msg } });
        }
        if (preview) {
          const audioRes = await fetch(preview);
          const audioBuf = Buffer.from(await audioRes.arrayBuffer());
          await sock.sendMessage(jid, { audio: audioBuf, mimetype: 'audio/mpeg', ptt: false }, { quoted: msg });
        }
        return;
      }
      // URL directe → oEmbed
      const oembed = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(trackUrl)}`);
      const data   = await oembed.json();
      await antiBan.safeSend(sock, jid, {
        text: `🎵 *${data.title}*\n👤 ${data.provider_name}\n🔗 ${trackUrl}\n\n> _ZERO TRACE 😈_`,
      }, { msgOptions: { quoted: msg } });
    } catch (e) {
      await antiBan.safeSend(sock, jid, { text: `❌ Erreur Spotify : _${e.message}_\nEssaie avec un lien Spotify direct.` }, { msgOptions: { quoted: msg } });
    }
  },
};

async function getSpotifyToken() {
  // Token public anonyme via endpoint Spotify
  const res  = await fetch('https://open.spotify.com/get_access_token?reason=transport&productType=web_player', {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Cookie': 'sp_t=1' }
  });
  const data = await res.json();
  return data.accessToken;
}
