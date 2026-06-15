/**
 * ZERO TRACE BOT v5.0 — video.js
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Téléchargement vidéo YouTube MP4
 * APIs : EliteProTech → Yupra → Okatsu (fallback chain)
 *
 * Commandes :
 *   .video [titre ou lien]   — télécharger une vidéo YouTube
 *   .yt [titre ou lien]      — alias
 *   .ytmp4 [titre ou lien]   — alias
 */
'use strict';

const axios = require('axios');

const BOT_TAG = '> ⚡ _ZERO TRACE BOT v5.0_';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
};

// ── Retry helper ──────────────────────────────────────────────────────────────
async function tryRequest(fn, attempts = 3) {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try { return await fn(); } catch (e) {
      lastErr = e;
      if (i < attempts) await new Promise(r => setTimeout(r, 1000 * i));
    }
  }
  throw lastErr;
}

// ── Recherche YouTube ─────────────────────────────────────────────────────────
async function searchVideo(query) {
  try {
    const yts = require('yt-search');
    const { videos } = await yts(query);
    return videos?.[0] || null;
  } catch {
    try {
      const res = await axios.get(
        `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
        { headers: HEADERS, timeout: 12000 }
      );
      const ids    = [...res.data.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)];
      const titles = [...res.data.matchAll(/"title":{"runs":\[{"text":"([^"]+)"/g)];
      const id     = ids[0]?.[1];
      if (!id) return null;
      return {
        url:       `https://www.youtube.com/watch?v=${id}`,
        title:     titles[0]?.[1] || query,
        thumbnail: `https://i.ytimg.com/vi/${id}/sddefault.jpg`,
        videoId:   id,
      };
    } catch { return null; }
  }
}

// ── API 1 : EliteProTech ──────────────────────────────────────────────────────
async function fromEliteProTech(url) {
  const res = await tryRequest(() => axios.get(
    `https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(url)}&format=mp4`,
    { headers: HEADERS, timeout: 60000 }
  ));
  if (res?.data?.success && res?.data?.downloadURL)
    return { download: res.data.downloadURL, title: res.data.title };
  throw new Error('EliteProTech: pas de downloadURL');
}

// ── API 2 : Yupra ─────────────────────────────────────────────────────────────
async function fromYupra(url) {
  const res = await tryRequest(() => axios.get(
    `https://api.yupra.my.id/api/downloader/ytmp4?url=${encodeURIComponent(url)}`,
    { headers: HEADERS, timeout: 60000 }
  ));
  if (res?.data?.success && res?.data?.data?.download_url)
    return { download: res.data.data.download_url, title: res.data.data.title, thumbnail: res.data.data.thumbnail };
  throw new Error('Yupra: pas de download_url');
}

// ── API 3 : Okatsu ────────────────────────────────────────────────────────────
async function fromOkatsu(url) {
  const res = await tryRequest(() => axios.get(
    `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp4?url=${encodeURIComponent(url)}`,
    { headers: HEADERS, timeout: 60000 }
  ));
  if (res?.data?.result?.mp4)
    return { download: res.data.result.mp4, title: res.data.result.title };
  throw new Error('Okatsu: pas de mp4');
}

const APIS = [
  { name: 'EliteProTech', fn: fromEliteProTech },
  { name: 'Yupra',        fn: fromYupra        },
  { name: 'Okatsu',       fn: fromOkatsu       },
];

// ── COMMANDE ──────────────────────────────────────────────────────────────────
module.exports = {
  name:    'video',
  aliases: ['yt', 'ytmp4', 'ytvideo', 'televideos'],

  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan } = ctx;

    const query = args.join(' ').trim();
    if (!query) {
      await antiBan.safeSend(sock, jid, {
        text:
          '🎬 *VIDEO DOWNLOAD*\n\n' +
          'Usage : `.video [titre ou lien YouTube]`\n' +
          'Ex : `.video Naruto opening 1`\n' +
          'Ex : `.video https://youtu.be/xxxx`\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    try {
      // ── 1. Résoudre l'URL ──────────────────────────────────────────────────
      let videoUrl = '', videoTitle = '', videoThumb = '';

      const isUrl = query.startsWith('http://') || query.startsWith('https://');
      if (isUrl) {
        videoUrl = query;
      } else {
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
        videoUrl   = video.url;
        videoTitle = video.title;
        videoThumb = video.thumbnail;
      }

      // ── Valider URL YouTube ────────────────────────────────────────────────
      const ytMatch = videoUrl.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
      if (!ytMatch) {
        await antiBan.safeSend(sock, jid, {
          text: '❌ Lien YouTube invalide.\n\n' + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      const ytId = ytMatch[1];
      const thumb = videoThumb || `https://i.ytimg.com/vi/${ytId}/sddefault.jpg`;

      // ── 2. Envoyer la miniature immédiatement ─────────────────────────────
      try {
        await sock.sendMessage(jid, {
          image:   { url: thumb },
          caption: `*${videoTitle || query}*\n\n_Téléchargement en cours..._`,
        }, { quoted: msg });
      } catch (e) {
        await antiBan.safeSend(sock, jid, {
          text: `🎬 *${videoTitle || query}*\n_Téléchargement en cours..._`,
        }, { msgOptions: { quoted: msg } });
      }

      // ── 3. Essayer les 3 APIs en fallback ─────────────────────────────────
      let videoData = null;
      for (const api of APIS) {
        try {
          videoData = await api.fn(videoUrl);
          const dlUrl = videoData?.download || videoData?.dl || videoData?.url;
          if (dlUrl) { console.log(`[VIDEO] ✅ ${api.name}`); break; }
          videoData = null;
        } catch (e) {
          console.log(`[VIDEO] ❌ ${api.name}: ${e.message}`);
        }
      }

      if (!videoData) {
        await antiBan.safeSend(sock, jid, {
          text:
            '❌ *Téléchargement impossible*\n\n' +
            'Les 3 sources ont échoué. La vidéo est peut-être :\n' +
            '- Protégée ou non disponible dans ta région\n' +
            '- Une vidéo de plus de 15 min (trop lourde)\n' +
            '- Un live ou contenu privé\n\n' + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      // ── 4. Envoyer la vidéo ───────────────────────────────────────────────
      const dlUrl   = videoData.download || videoData.dl || videoData.url;
      const title   = (videoData.title || videoTitle || query).replace(/[^\w\s\-àâéèêëîïôùûüç]/g, '').trim();
      const fileName = `${title.slice(0, 50)}.mp4`;

      await sock.sendMessage(jid, {
        video:    { url: dlUrl },
        mimetype: 'video/mp4',
        fileName,
        caption:  `🎬 *${title}*\n\n` + BOT_TAG,
      }, { quoted: msg });

    } catch (error) {
      console.error('[VIDEO] Erreur:', error.message);
      let errMsg = '❌ Téléchargement échoué.';
      if (error.message?.includes('blocked') || error.response?.status === 451)
        errMsg = '❌ Contenu bloqué dans ta région (erreur 451).';
      else if (error.message)
        errMsg = `❌ Erreur : \`${error.message}\``;

      await antiBan.safeSend(sock, jid, {
        text: errMsg + '\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
    }
  },
};
