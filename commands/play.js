/**
 * ZERO TRACE BOT v5.0 — play.js
 * ✅ FIX : conversion MP3 -> OGG/OPUS via ffmpeg pour PTT valide
 */
'use strict';

const axios  = require('axios');
const fs     = require('fs-extra');
const path   = require('path');
const { exec } = require('child_process');
const os     = require('os');

const BOT_TAG = '> ⚡ _ZERO TRACE BOT v5.0_';
const UA      = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36';

// ── Recherche YouTube ─────────────────────────────────────────────────────────
async function searchYT(query) {
  try {
    const yts = require('yt-search');
    const { videos } = await yts(query);
    if (videos?.[0]) return { url: videos[0].url, title: videos[0].title };
  } catch {}
  try {
    const res = await axios.get(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': UA }, timeout: 12000 }
    );
    const ids    = [...res.data.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)];
    const titles = [...res.data.matchAll(/"title":{"runs":\[{"text":"([^"]+)"/g)];
    const id = ids[0]?.[1];
    if (!id) return null;
    return { url: `https://www.youtube.com/watch?v=${id}`, title: titles[0]?.[1] || query };
  } catch { return null; }
}

// ── Télécharger buffer ────────────────────────────────────────────────────────
async function fetchBuffer(url) {
  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 90000,
    maxContentLength: 80 * 1024 * 1024,
    headers: { 'User-Agent': UA },
  });
  return Buffer.from(res.data);
}

// ── Convertir MP3 -> OGG Opus via ffmpeg ─────────────────────────────────────
async function convertToOgg(inputBuf) {
  const tmpDir = os.tmpdir();
  const inFile  = path.join(tmpDir, `zt_in_${Date.now()}.mp3`);
  const outFile = path.join(tmpDir, `zt_out_${Date.now()}.ogg`);

  try {
    await fs.writeFile(inFile, inputBuf);

    await new Promise((resolve, reject) => {
      // -c:a libopus : codec opus pour WhatsApp PTT
      // -b:a 64k     : bitrate raisonnable
      // -vn          : pas de video
      // -ar 48000    : sample rate requis par opus
      const cmd = `ffmpeg -y -i "${inFile}" -vn -c:a libopus -b:a 64k -ar 48000 "${outFile}" 2>/dev/null`;
      exec(cmd, { timeout: 30000 }, (err) => {
        if (err) reject(new Error(`ffmpeg: ${err.message}`));
        else resolve();
      });
    });

    const outBuf = await fs.readFile(outFile);
    if (!outBuf || outBuf.length < 1000) throw new Error('OGG vide après conversion');
    return outBuf;

  } finally {
    try { fs.remove(inFile); } catch {}
    try { fs.remove(outFile); } catch {}
  }
}

// ── APIs audio ────────────────────────────────────────────────────────────────
const AUDIO_APIS = [
  {
    name: 'apis-keith',
    fn: async (url) => {
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
    fn: async (url) => {
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
    fn: async (url) => {
      const res = await axios.get(
        `https://api.yupra.my.id/api/downloader/ytmp3?url=${encodeURIComponent(url)}`,
        { headers: { 'User-Agent': UA }, timeout: 30000 }
      );
      if (res.data?.success && res.data?.data?.download_url)
        return { url: res.data.data.download_url, title: res.data.data.title };
      throw new Error('Pas de download_url');
    },
  },
];

module.exports = {
  name:    'play',
  aliases: ['jouer', 'ptt', 'audio'],

  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan } = ctx;
    const query = args.join(' ').trim();

    if (!query) {
      await antiBan.safeSend(sock, jid, {
        text:
          '▶️ *PLAY — BULLE VOCALE*\n\n' +
          'Usage : `.play [titre ou artiste]`\n' +
          'Ex : `.play Bob Marley One Love`\n\n' +
          '_Le son joue directement comme un vocal 🎙️_\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    try {
      await sock.sendMessage(jid, { react: { text: '🎵', key: msg.key } }).catch(() => {});

      // 1. Trouver la vidéo
      let videoUrl, videoTitle;
      const isUrl = /https?:\/\/(www\.)?(youtube\.com|youtu\.be)/.test(query);
      if (isUrl) {
        videoUrl = query; videoTitle = query;
      } else {
        await antiBan.safeSend(sock, jid, {
          text: `🔍 _Recherche "${query}"..._`,
        }, { msgOptions: { quoted: msg } });
        const video = await searchYT(query);
        if (!video) throw new Error(`Aucun résultat pour "${query}"`);
        videoUrl = video.url; videoTitle = video.title;
      }

      await antiBan.safeSend(sock, jid, {
        text: `🎵 *${videoTitle}*\n\n_Chargement..._`,
      }, { msgOptions: { quoted: msg } });

      // 2. Essayer les APIs pour obtenir l'URL MP3
      let audioData = null;
      for (const api of AUDIO_APIS) {
        try {
          audioData = await api.fn(videoUrl);
          if (audioData?.url) { console.log(`[PLAY] OK ${api.name}`); break; }
        } catch (e) {
          console.log(`[PLAY] X ${api.name}: ${e.message}`);
        }
      }
      if (!audioData?.url) throw new Error('Toutes les sources audio ont échoué.');

      // 3. Télécharger le MP3
      const mp3Buf = await fetchBuffer(audioData.url);
      if (!mp3Buf || mp3Buf.length < 5000) throw new Error('Fichier audio invalide ou vide.');
      if (mp3Buf.length > 64 * 1024 * 1024) throw new Error(`Fichier trop lourd (${Math.round(mp3Buf.length/1024/1024)}MB). Utilise .song.`);

      // 4. Convertir MP3 → OGG/OPUS pour PTT WhatsApp
      let sendBuf = mp3Buf;
      let usePtt  = false;
      let mime    = 'audio/mpeg';

      try {
        console.log('[PLAY] Conversion MP3 -> OGG/Opus...');
        sendBuf = await convertToOgg(mp3Buf);
        usePtt  = true;
        mime    = 'audio/ogg; codecs=opus';
        console.log(`[PLAY] Conversion OK — ${sendBuf.length} bytes OGG`);
      } catch (convErr) {
        console.log(`[PLAY] Conversion échouée (${convErr.message}) — envoi MP3 direct`);
        // Fallback : envoyer le MP3 comme fichier audio (pas PTT mais lisible)
        usePtt = false;
        mime   = 'audio/mpeg';
      }

      // 5. Envoyer
      if (usePtt) {
        // PTT (bulle vocale) — OGG/Opus après conversion ffmpeg
        await antiBan.sendAudio(sock, jid, sendBuf, {
          ptt:      true,
          mimetype: 'audio/ogg; codecs=opus',
          quoted:   msg,
        });
      } else {
        // Pas de ffmpeg → envoyer comme fichier audio MP3 classique
        await sock.sendMessage(jid, {
          audio:    sendBuf,
          mimetype: 'audio/mpeg',
          ptt:      false,
          fileName: `${(audioData.title || query).slice(0, 50).replace(/[<>:"/\\|?*]/g,'')}.mp3`,
        }, { quoted: msg });
      }

      const title = (audioData.title || videoTitle || query).slice(0, 80);
      await antiBan.safeSend(sock, jid, {
        text: `▶️ *${title}*\n\n` + BOT_TAG,
      });

      await sock.sendMessage(jid, { react: { text: '▶️', key: msg.key } }).catch(() => {});

    } catch (e) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, {
        text: `❌ *Play échoué*\n\n${e.message}\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
    }
  },
};
