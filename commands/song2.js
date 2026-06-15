/**
 * ZERO TRACE BOT v5.0 — song2.js
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Téléchargement MP3 via yt-search + apis-keith
 * Source : commande fonctionnelle adaptée au format Zero Trace
 *
 * Commandes :
 *   .song2 [titre/artiste]   — télécharger un MP3
 *   .mp3 [titre/artiste]     — alias
 */
'use strict';

const axios = require('axios');

const BOT_TAG = '> ⚡ _ZERO TRACE BOT v5.0_';

// ── Recherche YouTube via yt-search ───────────────────────────────────────────
async function searchVideo(query) {
  try {
    const yts = require('yt-search');
    const { videos } = await yts(query);
    return videos?.[0] || null;
  } catch (e) {
    // Fallback si yt-search non installé : scraper YouTube directement
    try {
      const res = await axios.get(
        `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
        { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 }
      );
      const matches = [...res.data.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)];
      const titleMatches = [...res.data.matchAll(/"title":{"runs":\[{"text":"([^"]+)"/g)];
      const id    = matches[0]?.[1];
      const title = titleMatches[0]?.[1] || query;
      if (!id) return null;
      return { url: `https://www.youtube.com/watch?v=${id}`, title, videoId: id };
    } catch { return null; }
  }
}

// ── Téléchargement via apis-keith (méthode confirmée fonctionnelle) ────────────
async function downloadFromKeith(videoUrl) {
  const res = await axios.get(
    `https://apis-keith.vercel.app/download/dlmp3?url=${encodeURIComponent(videoUrl)}`,
    { timeout: 30000 }
  );
  const data = res.data;
  if (!data?.status || !data?.result?.downloadUrl) throw new Error('API Keith : pas de downloadUrl');
  return { url: data.result.downloadUrl, title: data.result.title || 'audio' };
}

// ── Fallback : autre API publique ─────────────────────────────────────────────
async function downloadFallback(videoUrl) {
  const res = await axios.get(
    `https://api.cobalt.tools/api/json`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      data: JSON.stringify({ url: videoUrl, isAudioOnly: true, aFormat: 'mp3' }),
      timeout: 20000,
    }
  );
  if (res.data?.url) return { url: res.data.url, title: 'audio' };
  throw new Error('Fallback échoué');
}

module.exports = {
  name:    'song2',
  aliases: ['mp3', 'musique', 'music'],

  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan } = ctx;

    const query = args.join(' ').trim();

    if (!query) {
      await antiBan.safeSend(sock, jid, {
        text:
          '🎵 *SONG DOWNLOAD*\n\n' +
          'Usage : `.song2 [titre ou artiste]`\n' +
          'Ex : `.song2 Kendrick Lamar HUMBLE`\n' +
          'Ex : `.mp3 Bob Marley No Woman No Cry`\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    try {
      // ── 1. Rechercher la vidéo ──────────────────────────────────────────────
      await antiBan.safeSend(sock, jid, {
        text: `🔍 _Recherche de "${query}"..._`,
      }, { msgOptions: { quoted: msg } });

      const video = await searchVideo(query);
      if (!video) {
        await antiBan.safeSend(sock, jid, {
          text: `❌ Aucun résultat pour *"${query}"*\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      // ── 2. Informer l'utilisateur ────────────────────────────────────────────
      await antiBan.safeSend(sock, jid, {
        text:
          `🎵 *${video.title}*\n` +
          `⏱️ ${video.duration?.timestamp || '?'} | 👁️ ${video.views ? (video.views / 1000).toFixed(0) + 'K vues' : ''}\n\n` +
          `_Téléchargement en cours..._`,
      }, { msgOptions: { quoted: msg } });

      // ── 3. Télécharger ───────────────────────────────────────────────────────
      let audioData = null;
      const errors  = [];

      // Méthode 1 : apis-keith (confirmée fonctionnelle)
      try {
        audioData = await downloadFromKeith(video.url);
      } catch (e) {
        errors.push(`Keith: ${e.message}`);
      }

      // Méthode 2 : fallback cobalt
      if (!audioData) {
        try {
          audioData = await downloadFallback(video.url);
        } catch (e) {
          errors.push(`Cobalt: ${e.message}`);
        }
      }

      if (!audioData?.url) {
        console.error('[SONG2] Tous les providers ont échoué:', errors.join(' | '));
        await antiBan.safeSend(sock, jid, {
          text:
            `❌ Téléchargement échoué pour *"${video.title}"*\n` +
            `_Essaie avec \`.song\` ou réessaie plus tard._\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      // ── 4. Envoyer le MP3 ────────────────────────────────────────────────────
      const title    = audioData.title || video.title || query;
      const fileName = `${title.replace(/[^\w\s-]/g, '').trim().slice(0, 50)}.mp3`;

      // ✅ FIX: télécharger le buffer avant envoi (évite expiration URL)
      let audioBuf2;
      try {
        const dlRes = await axios.get(audioData.url, {
          responseType: 'arraybuffer',
          timeout: 60000,
          maxContentLength: 60 * 1024 * 1024,
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        audioBuf2 = Buffer.from(dlRes.data);
        if (!audioBuf2 || audioBuf2.length < 5000) throw new Error('Buffer invalide');
      } catch (dlErr) {
        console.log('[SONG2] Fallback URL directe:', dlErr.message);
        await sock.sendMessage(jid, { audio: { url: audioData.url }, mimetype: 'audio/mpeg', fileName }, { quoted: msg });
        return;
      }
      await sock.sendMessage(jid, {
        audio:    audioBuf2,
        mimetype: 'audio/mpeg',
        ptt:      false,
        fileName,
      }, { quoted: msg });

    } catch (error) {
      console.error('[SONG2] Erreur:', error.message);
      await antiBan.safeSend(sock, jid, {
        text:
          `❌ Erreur inattendue : \`${error.message}\`\n\n` +
          `_Essaie \`.song [titre]\` comme alternative._\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
    }
  },
};
