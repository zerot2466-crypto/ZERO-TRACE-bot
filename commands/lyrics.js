/**
 * ZERO TRACE BOT v5.0 — .lyrics v2
 * Paroles d'une chanson — double API avec fallback
 * API 1 : lyricsapi.fly.dev  (plus précise, pas de clé)
 * API 2 : lyrics.ovh         (fallback classique)
 */
'use strict';
const fetch = require('node-fetch');

module.exports = {
  name: 'lyrics',
  aliases: ['paroles', 'lyric'],
  description: "Affiche les paroles d'une chanson",
  usage: '.lyrics [artiste - titre] | .lyrics [titre]',
  category: 'media',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan } = ctx;
    const query = args.join(' ').trim();

    if (!query) {
      await antiBan.safeSend(sock, jid, {
        text:
          `🎤 *.lyrics [artiste - titre]*\n\n` +
          `Exemples :\n` +
          `  *.lyrics Drake - God's Plan*\n` +
          `  *.lyrics Bohemian Rhapsody*\n\n` +
          `Alias : *.paroles* · *.lyric*\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    await sock.sendMessage(jid, { react: { text: '🎤', key: msg.key } }).catch(() => {});
    await antiBan.safeSend(sock, jid, { text: '🔍 _Recherche des paroles..._' }, { msgOptions: { quoted: msg } });

    // Séparer artiste / titre si format "artiste - titre"
    let artist = '', title = query;
    if (query.includes(' - ')) {
      [artist, title] = query.split(' - ').map(s => s.trim());
    } else if (query.includes(' – ')) {
      [artist, title] = query.split(' – ').map(s => s.trim());
    }

    let lyricsText = null;
    let songTitle  = title;
    let songArtist = artist || 'Inconnu';

    // ── API 1 : lyricsapi.fly.dev (précision élevée) ─────────────────────
    try {
      const searchTerm = artist ? `${artist} ${title}` : query;
      const res  = await fetch(`https://lyricsapi.fly.dev/api/lyrics?q=${encodeURIComponent(searchTerm)}`, { timeout: 8000 });
      if (res.ok) {
        const data = await res.json();
        if (data?.result?.lyrics) {
          lyricsText  = data.result.lyrics.trim();
          songTitle   = data.result.title  || title;
          songArtist  = data.result.artist || songArtist;
        }
      }
    } catch (e) {
      console.log('[LYRICS] API 1 échouée:', e.message);
    }

    // ── API 2 : lyrics.ovh (fallback) ────────────────────────────────────
    if (!lyricsText) {
      try {
        if (artist) {
          const res  = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`, { timeout: 8000 });
          const data = await res.json();
          if (data?.lyrics) {
            lyricsText = data.lyrics.trim();
          }
        } else {
          // Recherche par suggestion
          const sugRes  = await fetch(`https://api.lyrics.ovh/suggest/${encodeURIComponent(query)}`, { timeout: 8000 });
          const sugData = await sugRes.json();
          const first   = sugData?.data?.[0];
          if (first) {
            const res  = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(first.artist.name)}/${encodeURIComponent(first.title)}`, { timeout: 8000 });
            const data = await res.json();
            if (data?.lyrics) {
              lyricsText  = data.lyrics.trim();
              songTitle   = first.title;
              songArtist  = first.artist.name;
            }
          }
        }
      } catch (e) {
        console.log('[LYRICS] API 2 échouée:', e.message);
      }
    }

    if (!lyricsText) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, {
        text:
          `❌ *Paroles introuvables pour :* _${query}_\n\n` +
          `💡 Essaie avec le format :\n` +
          `  *.lyrics Artiste - Titre*\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // Tronquer si trop long (WhatsApp ~4000 chars)
    const MAX = 3500;
    const truncated  = lyricsText.length > MAX;
    const lyricsFinal = truncated ? lyricsText.slice(0, MAX) + '\n\n_[... paroles trop longues, tronquées]_' : lyricsText;

    await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});
    await antiBan.safeSend(sock, jid, {
      text:
        `🎤 *${songTitle}*\n` +
        `👤 _${songArtist}_\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `${lyricsFinal}\n\n` +
        `> *ZERO TRACE 😈*`,
    }, { msgOptions: { quoted: msg } });
  },
};
