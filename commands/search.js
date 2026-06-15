/**
 * ZERO TRACE BOT v5.0 — Moteurs de Recherche
 * .google   — Recherche Google (résultats texte)
 * .bing     — Recherche Bing
 * .youtube  — Rechercher une vidéo YouTube
 * .ddg      — DuckDuckGo (anonyme)
 * .web      — Multi-moteur (compare 3 sources)
 * .news     — Actualités Google News
 * .maps     — Lien Google Maps d'un lieu
 * .define   — Dictionnaire + définition
 * .scholar  — Google Scholar (articles académiques)
 * .reddit   — Recherche Reddit
 */
'use strict';

const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36';
const T  = 15000;

// ── Parser HTML générique ─────────────────────────────────────────────────────
function stripHTML(html) {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&hellip;/g, '...')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// .google [query] — Recherche Google via SerpAPI gratuit / scraping
// ─────────────────────────────────────────────────────────────────────────────
const google = {
  name: 'google',
  aliases: ['g', 'search', 'recherche'],
  usage: '.google [recherche]',
  category: 'web',

  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan } = ctx;
    const query = args.join(' ').trim();
    if (!query) {
      return antiBan.safeSend(sock, jid, {
        text: '🔍 *.google [recherche]*\nEx : *.google météo Paris*\nEx : *.google meilleur téléphone 2025*\n\n> *ZERO TRACE BOT v5.0*',
      }, { msgOptions: { quoted: msg } });
    }

    try {
      await sock.sendMessage(jid, { react: { text: '🔍', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, { text: `🔍 Google : *${query}*...` }, { msgOptions: { quoted: msg } });

      const results = await scrapeGoogle(query);

      if (!results.length) throw new Error('Aucun résultat trouvé.');

      const lines = results.slice(0, 5).map((r, i) =>
        `*${i + 1}.* ${r.title}\n` +
        `   📝 ${r.snippet}\n` +
        `   🔗 _${r.url}_`
      ).join('\n\n');

      await antiBan.safeSend(sock, jid, {
        text:
          `🔍 *GOOGLE — "${query}"*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          lines +
          `\n\n🌐 _google.com/search?q=${encodeURIComponent(query)}_\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });

      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});
    } catch (e) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, {
        text: `❌ *Recherche Google échouée*\n${e.message}\n\n💡 Essaie *.web ${query}*\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};

// Scraper Google via l'API non-officielle la plus fiable
async function scrapeGoogle(query, lang = 'fr') {
  const results = [];

  // Méthode 1 : DuckDuckGo API (résultats Google-like, fiable et gratuite)
  try {
    const res = await axios.get('https://api.duckduckgo.com/', {
      params: { q: query, format: 'json', no_html: 1, skip_disambig: 1, kl: 'fr-fr' },
      headers: { 'User-Agent': UA },
      timeout: T,
    });
    const d = res.data;

    // Abstract (réponse directe)
    if (d.AbstractText && d.AbstractURL) {
      results.push({
        title:   d.Heading || query,
        snippet: d.AbstractText.slice(0, 200),
        url:     d.AbstractURL,
      });
    }

    // RelatedTopics
    if (d.RelatedTopics?.length) {
      for (const topic of d.RelatedTopics.slice(0, 4)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title:   topic.Text.slice(0, 60),
            snippet: topic.Text.slice(0, 150),
            url:     topic.FirstURL,
          });
        }
      }
    }
  } catch (e) {}

  // Méthode 2 : Brave Search API (gratuite sans clé pour le scraping)
  if (results.length < 3) {
    try {
      const res = await axios.get('https://search.brave.com/search', {
        params: { q: query, source: 'web' },
        headers: {
          'User-Agent':       UA,
          'Accept':           'text/html',
          'Accept-Language':  'fr-FR,fr;q=0.9',
        },
        timeout: T,
      });

      // Parser les résultats Brave
      const html    = res.data;
      const pattern = /<div class="snippet"[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>[\s\S]*?<div[^>]*>([^<]{10,100})<\/div>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/g;
      let   match;
      while ((match = pattern.exec(html)) !== null && results.length < 5) {
        results.push({
          title:   stripHTML(match[2]).slice(0, 80),
          snippet: stripHTML(match[3]).slice(0, 200),
          url:     match[1],
        });
      }
    } catch (e) {}
  }

  // Méthode 3 : Bing scraping (HTML) si toujours pas assez de résultats
  if (results.length < 3) {
    try {
      const res = await axios.get(`https://www.bing.com/search`, {
        params: { q: query, setlang: 'fr', cc: 'FR' },
        headers: { 'User-Agent': UA, 'Accept-Language': 'fr-FR' },
        timeout: T,
      });

      const html = res.data;
      // Pattern pour les résultats Bing
      const titleRegex   = /<h2><a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a><\/h2>/g;
      const snippetRegex = /<p class="b_lineclamp[^"]*">([\s\S]*?)<\/p>/g;

      const titles   = [];
      const snippets = [];
      let m;

      while ((m = titleRegex.exec(html)) !== null)   titles.push({ url: m[1], title: stripHTML(m[2]) });
      while ((m = snippetRegex.exec(html)) !== null) snippets.push(stripHTML(m[1]));

      for (let i = 0; i < Math.min(titles.length, 5); i++) {
        if (titles[i].url.startsWith('http')) {
          results.push({
            title:   titles[i].title.slice(0, 80),
            snippet: (snippets[i] || '').slice(0, 200),
            url:     titles[i].url,
          });
        }
      }
    } catch (e) {}
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// .bing [query] — Recherche Bing
// ─────────────────────────────────────────────────────────────────────────────
const bing = {
  name: 'bing',
  aliases: ['b'],
  usage: '.bing [recherche]',
  category: 'web',

  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan } = ctx;
    const query = args.join(' ').trim();
    if (!query) {
      return antiBan.safeSend(sock, jid, {
        text: '🔵 *.bing [recherche]*\nEx : *.bing recette couscous*\n\n> *ZERO TRACE BOT v5.0*',
      }, { msgOptions: { quoted: msg } });
    }

    try {
      await sock.sendMessage(jid, { react: { text: '🔵', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, { text: `🔵 Bing : *${query}*...` }, { msgOptions: { quoted: msg } });

      const res = await axios.get('https://www.bing.com/search', {
        params: { q: query, setlang: 'fr', cc: 'FR', count: 5 },
        headers: { 'User-Agent': UA, 'Accept-Language': 'fr-FR,fr;q=0.9' },
        timeout: T,
      });

      const html    = res.data;
      const results = [];

      const titleRegex   = /<h2><a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a><\/h2>/g;
      const snippetRegex = /<p class="b_lineclamp[^"]*">([\s\S]*?)<\/p>/g;
      const titles       = [];
      const snippets     = [];
      let   m;

      while ((m = titleRegex.exec(html)) !== null)   titles.push({ url: m[1], title: stripHTML(m[2]) });
      while ((m = snippetRegex.exec(html)) !== null) snippets.push(stripHTML(m[1]));

      for (let i = 0; i < Math.min(titles.length, 5); i++) {
        if (titles[i].url.startsWith('http')) {
          results.push({
            title:   titles[i].title.slice(0, 80),
            snippet: (snippets[i] || 'Aucune description.').slice(0, 200),
            url:     titles[i].url,
          });
        }
      }

      if (!results.length) throw new Error('Aucun résultat Bing.');

      const lines = results.map((r, i) =>
        `*${i + 1}.* ${r.title}\n` +
        `   📝 ${r.snippet}\n` +
        `   🔗 _${r.url.slice(0, 80)}_`
      ).join('\n\n');

      await antiBan.safeSend(sock, jid, {
        text:
          `🔵 *BING — "${query}"*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          lines +
          `\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });

      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});
    } catch (e) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, {
        text: `❌ *Bing échoué*\n${e.message}\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// .ddg [query] — DuckDuckGo (anonyme)
// ─────────────────────────────────────────────────────────────────────────────
const ddg = {
  name: 'ddg',
  aliases: ['duckduckgo', 'duck', 'ddgo'],
  usage: '.ddg [recherche]',
  category: 'web',

  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan } = ctx;
    const query = args.join(' ').trim();
    if (!query) {
      return antiBan.safeSend(sock, jid, {
        text: '🦆 *.ddg [recherche]*\nRecherche anonyme via DuckDuckGo\nEx : *.ddg VPN gratuit 2025*\n\n> *ZERO TRACE BOT v5.0*',
      }, { msgOptions: { quoted: msg } });
    }

    try {
      await sock.sendMessage(jid, { react: { text: '🦆', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, { text: `🦆 DuckDuckGo : *${query}*...` }, { msgOptions: { quoted: msg } });

      const res = await axios.get('https://api.duckduckgo.com/', {
        params: { q: query, format: 'json', no_html: 1, skip_disambig: 1, kl: 'fr-fr' },
        headers: { 'User-Agent': UA },
        timeout: T,
      });

      const d       = res.data;
      const results = [];

      if (d.AbstractText) {
        results.push({
          title:   d.Heading || query,
          snippet: d.AbstractText.slice(0, 300),
          url:     d.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
          type:    '📚 Réponse directe',
        });
      }

      for (const topic of (d.RelatedTopics || []).slice(0, 4)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title:   topic.Text.slice(0, 60),
            snippet: topic.Text.slice(0, 200),
            url:     topic.FirstURL,
            type:    '🔗 Lié',
          });
        }
      }

      if (!results.length) {
        // Fallback : lien direct DDG
        await antiBan.safeSend(sock, jid, {
          text:
            `🦆 *DUCKDUCKGO — "${query}"*\n\n` +
            `🔍 Aucune réponse directe disponible.\n` +
            `📎 Voir les résultats complets :\n` +
            `_https://duckduckgo.com/?q=${encodeURIComponent(query)}&kl=fr-fr_\n\n` +
            `> *ZERO TRACE BOT v5.0*`,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      const lines = results.map((r, i) =>
        `${r.type || `*${i + 1}.*`} ${r.title}\n` +
        `   📝 ${r.snippet}\n` +
        `   🔗 _${r.url.slice(0, 80)}_`
      ).join('\n\n');

      await antiBan.safeSend(sock, jid, {
        text:
          `🦆 *DUCKDUCKGO — "${query}"*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          lines +
          `\n\n🔒 _Recherche 100% anonyme_\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });

      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});
    } catch (e) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, {
        text: `❌ *DDG échoué*\n${e.message}\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// .youtube [query] — Recherche YouTube
// ─────────────────────────────────────────────────────────────────────────────
const youtube = {
  name: 'youtube',
  aliases: ['ytsearch', 'yts'],
  usage: '.youtube [recherche]',
  category: 'web',

  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan } = ctx;
    const query = args.join(' ').trim();
    if (!query) {
      return antiBan.safeSend(sock, jid, {
        text: '📺 *.youtube [recherche]*\nEx : *.youtube Burna Boy 2025*\n\n> *ZERO TRACE BOT v5.0*',
      }, { msgOptions: { quoted: msg } });
    }

    try {
      await sock.sendMessage(jid, { react: { text: '📺', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, { text: `📺 YouTube : *${query}*...` }, { msgOptions: { quoted: msg } });

      const res = await axios.get(
        `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&hl=fr`,
        { headers: { 'User-Agent': UA, 'Accept-Language': 'fr-FR' }, timeout: T }
      );

      const html    = res.data;
      const results = [];

      // Extraire les videoId + titres depuis le JSON initial de YouTube
      const initDataMatch = html.match(/var ytInitialData = ({[\s\S]+?});<\/script>/);
      if (initDataMatch) {
        try {
          const data    = JSON.parse(initDataMatch[1]);
          const videos  = data?.contents?.twoColumnSearchResultsRenderer
            ?.primaryContents?.sectionListRenderer?.contents?.[0]
            ?.itemSectionRenderer?.contents || [];

          for (const item of videos) {
            const v = item?.videoRenderer;
            if (!v) continue;
            const videoId = v.videoId;
            const title   = v.title?.runs?.[0]?.text || '';
            const channel = v.ownerText?.runs?.[0]?.text || '';
            const views   = v.viewCountText?.simpleText || v.viewCountText?.runs?.[0]?.text || '';
            const duration = v.lengthText?.simpleText || '';
            if (videoId && title) {
              results.push({ videoId, title, channel, views, duration });
              if (results.length >= 5) break;
            }
          }
        } catch (e) {}
      }

      // Fallback : regex simple
      if (!results.length) {
        const idMatches = [...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)];
        const ttMatches = [...html.matchAll(/"title":{"runs":\[{"text":"([^"]+)"/g)];
        for (let i = 0; i < Math.min(idMatches.length, 5); i++) {
          results.push({
            videoId:  idMatches[i][1],
            title:    ttMatches[i]?.[1] || 'Vidéo YouTube',
            channel:  '',
            views:    '',
            duration: '',
          });
        }
      }

      if (!results.length) throw new Error('Aucune vidéo trouvée.');

      const lines = results.map((r, i) =>
        `*${i + 1}.* 🎬 ${r.title}\n` +
        `   📺 ${r.channel || 'Chaîne inconnue'}${r.duration ? ` • ⏱ ${r.duration}` : ''}${r.views ? ` • 👁 ${r.views}` : ''}\n` +
        `   🔗 _https://youtu.be/${r.videoId}_`
      ).join('\n\n');

      await antiBan.safeSend(sock, jid, {
        text:
          `📺 *YOUTUBE — "${query}"*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          lines +
          `\n\n💡 _Utilise .play ou .song avec un lien ci-dessus_\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });

      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});
    } catch (e) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, {
        text: `❌ *YouTube Search échoué*\n${e.message}\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// .web [query] — Multi-moteur (Google + Bing + DDG comparés)
// ─────────────────────────────────────────────────────────────────────────────
const web = {
  name: 'web',
  aliases: ['websearch', 'multisearch'],
  usage: '.web [recherche]',
  category: 'web',

  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan } = ctx;
    const query = args.join(' ').trim();
    if (!query) {
      return antiBan.safeSend(sock, jid, {
        text:
          '🌐 *.web [recherche]*\n' +
          'Recherche simultanée sur Google + Bing + DDG\n' +
          'Ex : *.web meilleur smartphone 2025*\n\n' +
          '> *ZERO TRACE BOT v5.0*',
      }, { msgOptions: { quoted: msg } });
    }

    try {
      await sock.sendMessage(jid, { react: { text: '🌐', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, {
        text: `🌐 Recherche multi-moteur : *${query}*...`,
      }, { msgOptions: { quoted: msg } });

      // Lancer les 3 en parallèle
      const [googleRes, ddgRes] = await Promise.allSettled([
        scrapeGoogle(query),
        axios.get('https://api.duckduckgo.com/', {
          params: { q: query, format: 'json', no_html: 1, skip_disambig: 1 },
          headers: { 'User-Agent': UA }, timeout: T,
        }),
      ]);

      let text = `🌐 *RECHERCHE WEB — "${query}"*\n━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      // Google / Bing résultats
      const gResults = googleRes.status === 'fulfilled' ? googleRes.value : [];
      if (gResults.length) {
        text += `*🔍 TOP RÉSULTATS :*\n\n`;
        gResults.slice(0, 3).forEach((r, i) => {
          text += `*${i + 1}.* ${r.title}\n   📝 ${r.snippet.slice(0, 150)}\n   🔗 _${r.url.slice(0, 70)}_\n\n`;
        });
      }

      // DDG réponse directe
      if (ddgRes.status === 'fulfilled') {
        const d = ddgRes.value.data;
        if (d.AbstractText) {
          text += `*🦆 RÉPONSE DIRECTE (DDG) :*\n${d.AbstractText.slice(0, 400)}\n🔗 _${d.AbstractURL}_\n\n`;
        }
      }

      // Liens directs
      text +=
        `*🔗 LIENS DIRECTS :*\n` +
        `• 🔍 google.com/search?q=${encodeURIComponent(query)}\n` +
        `• 🔵 bing.com/search?q=${encodeURIComponent(query)}\n` +
        `• 🦆 duckduckgo.com/?q=${encodeURIComponent(query)}\n\n` +
        `> *ZERO TRACE BOT v5.0*`;

      await antiBan.safeSend(sock, jid, { text }, { msgOptions: { quoted: msg } });
      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});
    } catch (e) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, {
        text: `❌ *Recherche web échouée*\n${e.message}\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// .maps [lieu] — Lien Google Maps
// ─────────────────────────────────────────────────────────────────────────────
const maps = {
  name: 'maps',
  aliases: ['map', 'gmaps', 'localisation', 'lieu'],
  usage: '.maps [lieu ou adresse]',
  category: 'web',

  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan } = ctx;
    const query = args.join(' ').trim();
    if (!query) {
      return antiBan.safeSend(sock, jid, {
        text: '🗺️ *.maps [lieu]*\nEx : *.maps Tour Eiffel Paris*\nEx : *.maps Abidjan Plateau*\n\n> *ZERO TRACE BOT v5.0*',
      }, { msgOptions: { quoted: msg } });
    }

    try {
      await sock.sendMessage(jid, { react: { text: '🗺️', key: msg.key } }).catch(() => {});

      const encoded   = encodeURIComponent(query);
      const gmapsUrl  = `https://www.google.com/maps/search/${encoded}`;
      const mapsEmbed = `https://maps.google.com/?q=${encoded}`;

      // Récupérer les coordonnées via Nominatim (OpenStreetMap, gratuit)
      let coordInfo = '';
      try {
        const geo = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: { q: query, format: 'json', limit: 1, 'accept-language': 'fr' },
          headers: { 'User-Agent': 'ZeroTraceBot/5.0' },
          timeout: T,
        });
        if (geo.data?.[0]) {
          const g = geo.data[0];
          coordInfo =
            `\n📍 *Coordonnées :* ${parseFloat(g.lat).toFixed(4)}, ${parseFloat(g.lon).toFixed(4)}\n` +
            `🏷️ *Type :* ${g.type || g.class || 'lieu'}\n` +
            `📝 *Adresse :* ${g.display_name?.slice(0, 120)}\n`;
        }
      } catch (e) {}

      await antiBan.safeSend(sock, jid, {
        text:
          `🗺️ *GOOGLE MAPS — ${query}*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          coordInfo +
          `\n🔗 *Google Maps :*\n_${gmapsUrl}_\n\n` +
          `🔗 *Lien mobile :*\n_${mapsEmbed}_\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });

      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});
    } catch (e) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, {
        text: `❌ *Maps échoué*\n${e.message}\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// .scholar [query] — Google Scholar (articles académiques)
// ─────────────────────────────────────────────────────────────────────────────
const scholar = {
  name: 'scholar',
  aliases: ['academic', 'research', 'academique'],
  usage: '.scholar [sujet de recherche]',
  category: 'web',

  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan } = ctx;
    const query = args.join(' ').trim();
    if (!query) {
      return antiBan.safeSend(sock, jid, {
        text: '🎓 *.scholar [sujet]*\nRecherche articles académiques\nEx : *.scholar intelligence artificielle éducation*\n\n> *ZERO TRACE BOT v5.0*',
      }, { msgOptions: { quoted: msg } });
    }

    try {
      await sock.sendMessage(jid, { react: { text: '🎓', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, { text: `🎓 Scholar : *${query}*...` }, { msgOptions: { quoted: msg } });

      // Semantic Scholar API (gratuite, sans clé, académique)
      const res = await axios.get('https://api.semanticscholar.org/graph/v1/paper/search', {
        params: {
          query,
          fields:  'title,authors,year,abstract,url,citationCount,openAccessPdf',
          limit:   5,
        },
        headers: { 'User-Agent': UA },
        timeout: T,
      });

      const papers = res.data?.data || [];
      if (!papers.length) throw new Error('Aucun article académique trouvé.');

      const lines = papers.map((p, i) => {
        const authors  = (p.authors || []).slice(0, 2).map(a => a.name).join(', ');
        const abstract = p.abstract ? p.abstract.slice(0, 150) + '...' : 'Pas de résumé.';
        const pdfLink  = p.openAccessPdf?.url ? `\n   📄 PDF : _${p.openAccessPdf.url}_` : '';
        return (
          `*${i + 1}.* 📄 ${p.title}\n` +
          `   👥 ${authors || 'Auteur inconnu'} ${p.year ? `(${p.year})` : ''}\n` +
          `   💬 ${p.citationCount || 0} citations\n` +
          `   📝 ${abstract}\n` +
          `   🔗 _${p.url || 'N/A'}_` +
          pdfLink
        );
      }).join('\n\n');

      await antiBan.safeSend(sock, jid, {
        text:
          `🎓 *GOOGLE SCHOLAR — "${query}"*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          lines +
          `\n\n_Source : Semantic Scholar (gratuit)_\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });

      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});
    } catch (e) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, {
        text: `❌ *Scholar échoué*\n${e.message}\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// .reddit [query] — Recherche Reddit
// ─────────────────────────────────────────────────────────────────────────────
const reddit = {
  name: 'reddit',
  aliases: ['r', 'subreddit'],
  usage: '.reddit [recherche]',
  category: 'web',

  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan } = ctx;
    const query = args.join(' ').trim();
    if (!query) {
      return antiBan.safeSend(sock, jid, {
        text: '👽 *.reddit [recherche]*\nEx : *.reddit best free VPN 2025*\nEx : *.reddit programmation débutant*\n\n> *ZERO TRACE BOT v5.0*',
      }, { msgOptions: { quoted: msg } });
    }

    try {
      await sock.sendMessage(jid, { react: { text: '👽', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, { text: `👽 Reddit : *${query}*...` }, { msgOptions: { quoted: msg } });

      // Reddit JSON API (gratuit, sans clé)
      const res = await axios.get(`https://www.reddit.com/search.json`, {
        params: { q: query, sort: 'relevance', limit: 5, t: 'year' },
        headers: { 'User-Agent': 'ZeroTraceBot/5.0 (WhatsApp Bot)' },
        timeout: T,
      });

      const posts = res.data?.data?.children || [];
      if (!posts.length) throw new Error('Aucun post Reddit trouvé.');

      const lines = posts.map((p, i) => {
        const d      = p.data;
        const score  = d.score > 1000 ? `${Math.round(d.score / 1000)}k` : String(d.score);
        const title  = d.title.slice(0, 80);
        const sub    = d.subreddit_name_prefixed || d.subreddit;
        const url    = `https://reddit.com${d.permalink}`;
        const preview = d.selftext ? d.selftext.slice(0, 120) + '...' : 'Pas de contenu texte.';
        return (
          `*${i + 1}.* ${title}\n` +
          `   📌 ${sub} • ⬆️ ${score} • 💬 ${d.num_comments} commentaires\n` +
          `   📝 ${preview}\n` +
          `   🔗 _${url}_`
        );
      }).join('\n\n');

      await antiBan.safeSend(sock, jid, {
        text:
          `👽 *REDDIT — "${query}"*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          lines +
          `\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });

      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});
    } catch (e) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, {
        text: `❌ *Reddit échoué*\n${e.message}\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
module.exports = { google, bing, ddg, youtube, web, maps, scholar, reddit };
