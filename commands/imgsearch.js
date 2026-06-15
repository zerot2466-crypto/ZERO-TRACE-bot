/**
 * ZERO TRACE BOT v5.0 — Google Images Search
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * API 1 : api.drexapp.space/search/google-images  ← NOUVELLE
 * API 2 : Google Custom Search API (fallback si clé GOOGLE_CSE_KEY définie)
 * API 3 : Bing Images scrape (fallback ultime)
 *
 * Commandes :
 *   .imgsearch [requête]     → envoie 1 image
 *   .imgsearch [requête] 3   → envoie 3 images (max 5)
 */
'use strict';
const axios = require('axios');
const DREX  = 'https://api.drexapp.space';

async function searchGoogleImages(query, count = 1) {
  // ── API 1 : drexapp google-images (principale) ─────────────────────────
  try {
    const res = await axios.get(
      `${DREX}/search/google-images?q=${encodeURIComponent(query)}&count=${count}`,
      { timeout: 15000 }
    );
    const d = res.data;
    if (d?.status && d?.result?.length) {
      // Résultat attendu : [{ url, title, source, thumbnail }, ...]
      return d.result.slice(0, count).map(img => ({
        url:       img.url       || img.image || img.link,
        title:     img.title     || img.name  || query,
        source:    img.source    || img.origin || '',
        thumbnail: img.thumbnail || img.thumb  || null,
      })).filter(img => img.url);
    }
  } catch (e) { console.log('[IMGSEARCH] drexapp échoué:', e.message); }

  // ── API 2 : Google Custom Search (si clé configurée) ───────────────────
  if (process.env.GOOGLE_CSE_KEY && process.env.GOOGLE_CSE_CX) {
    try {
      const res = await axios.get(
        `https://www.googleapis.com/customsearch/v1`,
        {
          params: {
            key: process.env.GOOGLE_CSE_KEY,
            cx:  process.env.GOOGLE_CSE_CX,
            q:   query,
            searchType: 'image',
            num: Math.min(count, 5),
          },
          timeout: 15000,
        }
      );
      if (res.data?.items?.length) {
        return res.data.items.slice(0, count).map(item => ({
          url:       item.link,
          title:     item.title  || query,
          source:    item.displayLink || '',
          thumbnail: item.image?.thumbnailLink || null,
        }));
      }
    } catch (e) {}
  }

  // ── API 3 : Bing Images ─────────────────────────────────────────────────
  try {
    const res = await axios.get(
      `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }, timeout: 12000 }
    );
    const matches = [...res.data.matchAll(/murl&quot;:&quot;([^&]+)&quot;/g)];
    const urls = matches.slice(0, count).map(m => ({
      url:       decodeURIComponent(m[1]),
      title:     query,
      source:    'Bing Images',
      thumbnail: null,
    }));
    if (urls.length) return urls;
  } catch (e) {}

  throw new Error(`Aucun résultat trouvé pour "${query}"`);
}

module.exports = {
  name:    'imgsearch',
  aliases: ['imgs', 'gimage', 'gimages', 'image'],
  description: 'Rechercher des images sur Google',
  usage:   '.imgsearch [requête] | .imgsearch [requête] [1-5]',
  category: 'outils',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan } = ctx;

    // Extraire le nombre d'images si le dernier arg est un chiffre
    let count = 1;
    let queryArgs = [...args];
    const lastArg = parseInt(queryArgs[queryArgs.length - 1]);
    if (!isNaN(lastArg) && lastArg >= 1 && lastArg <= 5) {
      count = lastArg;
      queryArgs.pop();
    }

    const query = queryArgs.join(' ').trim();

    if (!query) {
      await antiBan.safeSend(sock, jid, {
        text:
          `🖼️ *.imgsearch [requête]*\n\n` +
          `Exemples :\n` +
          `• *.imgsearch coucher de soleil*\n` +
          `• *.imgsearch Bugatti 3*  _(envoie 3 images)_\n\n` +
          `💡 Tu peux demander jusqu'à *5 images* en même temps\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    try {
      await sock.sendMessage(jid, { react: { text: '🔍', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, {
        text: `🔍 _Recherche "${query}" — ${count} image${count > 1 ? 's' : ''}..._`,
      }, { msgOptions: { quoted: msg } });

      const results = await searchGoogleImages(query, count);

      if (!results.length) throw new Error('Aucune image trouvée');

      let sent = 0;
      for (const img of results) {
        try {
          const res = await axios.get(img.url, {
            responseType: 'arraybuffer',
            timeout: 20000,
            maxContentLength: 20 * 1024 * 1024,
            headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.google.com' },
          });
          const buf  = Buffer.from(res.data);
          const mime = img.url.includes('.png') ? 'image/png' : 'image/jpeg';

          const caption = count === 1
            ? `🖼️ *${img.title.slice(0, 80)}*\n` +
              (img.source ? `🌐 Source : ${img.source}\n` : '') +
              `\n> *ZERO TRACE BOT v5.0*`
            : `[${sent + 1}/${results.length}] ${img.title.slice(0, 60)}`;

          await sock.sendMessage(jid, { image: buf, caption, mimetype: mime }, { quoted: count === 1 ? msg : undefined });
          sent++;
        } catch (e) {
          console.log(`[IMGSEARCH] Image ${sent + 1} échouée:`, e.message);
        }
      }

      if (sent === 0) throw new Error('Impossible de télécharger les images trouvées');

      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});

    } catch (err) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, {
        text: `❌ Erreur recherche image : ${err.message}\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};
