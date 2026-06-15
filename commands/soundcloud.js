/**
 * ZERO TRACE BOT v5.0 — SoundCloud Download
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * API 1 : api.drexapp.space/downloader/soundcloud
 * API 2 : soundcloudmp3.art (fallback)
 * API 3 : scdl Python wrapper via youtubedl (fallback)
 *
 * Commandes : .soundcloud [lien] | .sc [lien]
 */
'use strict';
const axios = require('axios');
const DREX  = 'https://api.drexapp.space';

async function downloadSoundCloud(url) {
  // ── API 1 : drexapp (principale) ───────────────────────────────────────
  try {
    const res = await axios.get(
      `${DREX}/downloader/soundcloud?url=${encodeURIComponent(url)}`,
      { timeout: 25000 }
    );
    const d = res.data;
    if (d?.status && d?.result) {
      const r = d.result;
      // Résultat attendu : { downloadURL, title, artist, artwork, duration }
      const dlUrl = r.downloadURL || r.url || r.audio;
      if (dlUrl) {
        return {
          url:      dlUrl,
          title:    r.title    || r.name  || 'SoundCloud Track',
          artist:   r.artist   || r.user?.username || '',
          duration: r.duration || '',
          artwork:  r.artwork  || r.artwork_url || null,
        };
      }
    }
  } catch (e) { console.log('[SC] drexapp échoué:', e.message); }

  // ── API 2 : soundcloudmp3.art ───────────────────────────────────────────
  try {
    const res = await axios.post(
      'https://soundcloudmp3.art/api/',
      `url=${encodeURIComponent(url)}`,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 }
    );
    const d = res.data;
    if (d?.url || d?.downloadUrl) {
      return {
        url:    d.downloadUrl || d.url,
        title:  d.title  || 'SoundCloud Track',
        artist: d.artist || '',
        duration: '',
        artwork: null,
      };
    }
  } catch (e) {}

  // ── API 3 : sndcld.org ──────────────────────────────────────────────────
  try {
    const res = await axios.get(
      `https://sndcld.org/api/download?url=${encodeURIComponent(url)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 }
    );
    const d = res.data;
    if (d?.url) {
      return {
        url:    d.url,
        title:  d.title  || 'SoundCloud Track',
        artist: d.artist || '',
        duration: d.duration || '',
        artwork: d.artwork || null,
      };
    }
  } catch (e) {}

  throw new Error('Impossible de télécharger depuis SoundCloud. Lien invalide ou piste privée.');
}

module.exports = {
  name:    'soundcloud',
  aliases: ['sc', 'scloud'],
  description: 'Télécharger une piste SoundCloud en MP3',
  usage:   '.soundcloud [lien SoundCloud]',
  category: 'media',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan } = ctx;
    const url = args[0];

    if (!url || !url.includes('soundcloud')) {
      await antiBan.safeSend(sock, jid, {
        text:
          `🎵 *.soundcloud [lien]*\n` +
          `Ex : *.soundcloud https://soundcloud.com/artiste/titre*\n\n` +
          `Alias : *.sc [lien]*\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    try {
      await sock.sendMessage(jid, { react: { text: '🎵', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, { text: '🎵 _Téléchargement SoundCloud en cours..._' }, { msgOptions: { quoted: msg } });

      const data = await downloadSoundCloud(url);

      // Télécharger le fichier audio
      const res = await axios.get(data.url, {
        responseType: 'arraybuffer',
        timeout: 90000,
        maxContentLength: 50 * 1024 * 1024,
      });
      const buf = Buffer.from(res.data);

      const caption =
        `🎵 *${data.title}*\n` +
        (data.artist   ? `👤 *Artiste :* ${data.artist}\n`   : '') +
        (data.duration ? `⏱️ *Durée :* ${data.duration}\n`   : '') +
        `\n> *ZERO TRACE BOT v5.0*`;

      // Envoyer la pochette d'artwork si disponible
      if (data.artwork) {
        try {
          const artRes = await axios.get(data.artwork, { responseType: 'arraybuffer', timeout: 10000 });
          await sock.sendMessage(jid, { image: Buffer.from(artRes.data), caption }, { quoted: msg });
        } catch (e) {}
      }

      // Envoyer l'audio
      await sock.sendMessage(jid, {
        audio:    buf,
        mimetype: 'audio/mpeg',
        ptt:      false,
        fileName: `${data.title}.mp3`,
      }, { quoted: msg });

      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});

    } catch (err) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, {
        text:
          `❌ Erreur SoundCloud : ${err.message}\n\n` +
          `💡 Vérifie que la piste est publique et le lien valide.\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};
