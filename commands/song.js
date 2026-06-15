/**
 * ZERO TRACE BOT v5.0 — song.js (réécrit)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Téléchargement MP3 YouTube — APIs confirmées fonctionnelles
 *
 * Chain : apis-keith → EliteProTech → Yupra → Okatsu
 */
'use strict';

const axios = require('axios');

const BOT_TAG = '> ⚡ _ZERO TRACE BOT v5.0_';
const UA      = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36';

// ── Recherche YouTube ─────────────────────────────────────────────────────────
async function searchYT(query) {
  // Essai 1 : yt-search
  try {
    const yts = require('yt-search');
    const { videos } = await yts(query);
    if (videos?.[0]) return { url: videos[0].url, title: videos[0].title, id: videos[0].videoId, duration: videos[0].duration?.timestamp };
  } catch {}

  // Essai 2 : scraper YouTube
  try {
    const res = await axios.get(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': UA }, timeout: 12000 }
    );
    const ids    = [...res.data.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)];
    const titles = [...res.data.matchAll(/"title":{"runs":\[{"text":"([^"]+)"/g)];
    const id = ids[0]?.[1];
    if (!id) return null;
    return { url: `https://www.youtube.com/watch?v=${id}`, title: titles[0]?.[1] || query, id };
  } catch { return null; }
}

// ── APIs MP3 (toutes confirmées fonctionnelles) ────────────────────────────────
const MP3_APIS = [
  {
    name: 'apis-keith',
    fn:   async (url) => {
      const res = await axios.get(
        `https://apis-keith.vercel.app/download/dlmp3?url=${encodeURIComponent(url)}`,
        { headers: { 'User-Agent': UA }, timeout: 30000 }
      );
      if (res.data?.status && res.data?.result?.downloadUrl)
        return { url: res.data.result.downloadUrl, title: res.data.result.title };
      throw new Error('Pas de downloadUrl');
    },
  },
  {
    name: 'EliteProTech',
    fn:   async (url) => {
      const res = await axios.get(
        `https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(url)}&format=mp3`,
        { headers: { 'User-Agent': UA }, timeout: 30000 }
      );
      if (res.data?.success && res.data?.downloadURL)
        return { url: res.data.downloadURL, title: res.data.title };
      throw new Error('Pas de downloadURL');
    },
  },
  {
    name: 'Yupra',
    fn:   async (url) => {
      const res = await axios.get(
        `https://api.yupra.my.id/api/downloader/ytmp3?url=${encodeURIComponent(url)}`,
        { headers: { 'User-Agent': UA }, timeout: 30000 }
      );
      if (res.data?.success && res.data?.data?.download_url)
        return { url: res.data.data.download_url, title: res.data.data.title };
      throw new Error('Pas de download_url');
    },
  },
  {
    name: 'Okatsu',
    fn:   async (url) => {
      const res = await axios.get(
        `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${encodeURIComponent(url)}`,
        { headers: { 'User-Agent': UA }, timeout: 30000 }
      );
      if (res.data?.result?.mp3)
        return { url: res.data.result.mp3, title: res.data.result.title };
      throw new Error('Pas de mp3');
    },
  },
];

module.exports = {
  name:    'song',
  aliases: ['mp3dl', 'mp3dl2'],

  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan } = ctx;
    const query = args.join(' ').trim();

    if (!query) {
      await antiBan.safeSend(sock, jid, {
        text:
          '🎵 *SONG — MP3 DOWNLOAD*\n\n' +
          'Usage : `.song [titre ou artiste]`\n' +
          'Ex : `.song Kendrick Lamar HUMBLE`\n' +
          'Ex : `.song https://youtu.be/xxx`\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    try {
      await sock.sendMessage(jid, { react: { text: '🔍', key: msg.key } }).catch(() => {});

      // ── 1. Résoudre la vidéo ──────────────────────────────────────────────
      let videoUrl, videoTitle, videoDuration;

      const isUrl = /https?:\/\/(www\.)?(youtube\.com|youtu\.be)/.test(query);
      if (isUrl) {
        videoUrl = query;
        const m  = query.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        videoTitle = m?.[1] || query;
      } else {
        await antiBan.safeSend(sock, jid, {
          text: `🔍 _Recherche "${query}"..._`,
        }, { msgOptions: { quoted: msg } });
        const video = await searchYT(query);
        if (!video) throw new Error(`Aucun résultat pour "${query}"`);
        videoUrl      = video.url;
        videoTitle    = video.title;
        videoDuration = video.duration;
      }

      await antiBan.safeSend(sock, jid, {
        text:
          `🎵 *${videoTitle}*${videoDuration ? ` — ${videoDuration}` : ''}\n\n` +
          `_Téléchargement MP3 en cours..._`,
      }, { msgOptions: { quoted: msg } });

      // ── 2. Essayer les APIs dans l'ordre ──────────────────────────────────
      let audioData = null;
      for (const api of MP3_APIS) {
        try {
          audioData = await api.fn(videoUrl);
          if (audioData?.url) {
            console.log(`[SONG] ✅ ${api.name}`);
            break;
          }
        } catch (e) {
          console.log(`[SONG] ❌ ${api.name}: ${e.message}`);
        }
      }

      if (!audioData?.url) throw new Error('Toutes les sources MP3 ont échoué. Réessaie plus tard.');

      // ── 3. Envoyer le MP3 ─────────────────────────────────────────────────
      const title    = (audioData.title || videoTitle || query).replace(/[<>:"/\\|?*]/g, '').trim();
      const fileName = `${title.slice(0, 50)}.mp3`;

      // ✅ FIX: télécharger le buffer avant envoi (évite expiration URL)
      let audioBuf;
      try {
        const dlRes = await axios.get(audioData.url, {
          responseType: 'arraybuffer',
          timeout: 60000,
          maxContentLength: 60 * 1024 * 1024,
          headers: { 'User-Agent': UA },
        });
        audioBuf = Buffer.from(dlRes.data);
      } catch (dlErr) {
        console.log('[SONG] Téléchargement buffer échoué, fallback URL:', dlErr.message);
        // Fallback : envoyer via URL directe
        await sock.sendMessage(jid, { audio: { url: audioData.url }, mimetype: 'audio/mpeg', ptt: false, fileName }, { quoted: msg });
        await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});
        return;
      }
      if (!audioBuf || audioBuf.length < 5000) throw new Error('Fichier audio invalide après téléchargement.');
      await sock.sendMessage(jid, {
        audio:    audioBuf,
        mimetype: 'audio/mpeg',
        ptt:      false,
        fileName,
      }, { quoted: msg });

      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});

    } catch (e) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, {
        text: `❌ *Song échoué*\n\n${e.message}\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
    }
  },
};
