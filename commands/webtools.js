/**
 * ZERO TRACE BOT v5.0 — Web Navigation Tools
 * .screenshot  — Capture d'écran d'un site
 * .scrape      — Extraire le texte d'une page web
 * .shorturl    — Raccourcir un lien
 * .ipinfo      — Infos complètes sur une IP
 * .headers     — En-têtes HTTP d'un site
 * .sitestatus  — Vérifier si un site est en ligne
 * .pastebin    — Créer un pastebin rapide
 * .qrread      — Lire un QR code (image en reply)
 */
'use strict';

const axios = require('axios');

const T = 15000;

// ─────────────────────────────────────────────────────────────────────────────
// .screenshot [url] — Capture d'écran via API gratuite
// ─────────────────────────────────────────────────────────────────────────────
const screenshot = {
  name: 'screenshot',
  aliases: ['screen', 'webscreen'],
  usage: '.screenshot [url]',
  category: 'web',
  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan } = ctx;
    let url = args[0]?.trim();
    if (!url) {
      return antiBan.safeSend(sock, jid, {
        text: '📸 *.screenshot [url]*\nEx : *.screenshot https://google.com*',
      }, { msgOptions: { quoted: msg } });
    }
    if (!url.startsWith('http')) url = 'https://' + url;

    try {
      await sock.sendMessage(jid, { react: { text: '📸', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, { text: `📸 Capture de *${url}*...` }, { msgOptions: { quoted: msg } });

      // Essai 1 : screenshotone (gratuit sans clé)
      let imgBuf = null;
      const apis = [
        `https://api.screenshotone.com/take?url=${encodeURIComponent(url)}&viewport_width=1280&viewport_height=800&format=jpg&image_quality=80`,
        `https://image.thum.io/get/width/1280/${encodeURIComponent(url)}`,
        `https://api.thumbnail.ws/api/abc123/thumbnail/get?url=${encodeURIComponent(url)}&width=1280`,
        `https://s0.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=1280`,
      ];

      for (const api of apis) {
        try {
          const res = await axios.get(api, {
            responseType: 'arraybuffer', timeout: 25000,
            headers: { 'User-Agent': 'Mozilla/5.0' },
          });
          const buf = Buffer.from(res.data);
          // Vérifier que c'est bien une image (pas une erreur HTML)
          if (buf.length > 5000 && (buf[0] === 0xFF || buf[0] === 0x89 || buf[1] === 0x50)) {
            imgBuf = buf;
            break;
          }
        } catch (e) {}
      }

      if (!imgBuf) throw new Error('Impossible de capturer ce site. Vérifie que l\'URL est accessible.');

      await sock.sendMessage(jid, {
        image:   imgBuf,
        caption: `📸 *Screenshot de :* ${url}\n\n> *ZERO TRACE BOT v5.0*`,
        mimetype: 'image/jpeg',
      }, { quoted: msg });

      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});
    } catch (e) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, { text: `❌ *Screenshot échoué*\n${e.message}` }, { msgOptions: { quoted: msg } });
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// .scrape [url] — Extraire le texte d'une page web
// ─────────────────────────────────────────────────────────────────────────────
const scrape = {
  name: 'scrape',
  aliases: ['extract', 'readsite'],
  usage: '.scrape [url]',
  category: 'web',
  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan } = ctx;
    let url = args[0]?.trim();
    if (!url) {
      return antiBan.safeSend(sock, jid, {
        text: '🔍 *.scrape [url]*\nExtrait le contenu texte d\'une page web.\nEx : *.scrape https://example.com*',
      }, { msgOptions: { quoted: msg } });
    }
    if (!url.startsWith('http')) url = 'https://' + url;

    try {
      await sock.sendMessage(jid, { react: { text: '🔍', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, { text: `🔍 Lecture de *${url}*...` }, { msgOptions: { quoted: msg } });

      const res = await axios.get(url, {
        timeout: 20000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120',
          'Accept':     'text/html,application/xhtml+xml',
          'Accept-Language': 'fr-FR,fr;q=0.9',
        },
        maxContentLength: 5 * 1024 * 1024,
      });

      let html = res.data;

      // Nettoyer le HTML : supprimer scripts, styles, balises
      html = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s{3,}/g, '\n\n')
        .trim();

      if (html.length < 10) throw new Error('Page vide ou non lisible.');

      // Tronquer à 1500 caractères
      const preview = html.length > 1500 ? html.slice(0, 1500) + '\n\n_[...tronqué]_' : html;

      await antiBan.safeSend(sock, jid, {
        text:
          `🌐 *Contenu de :* ${url}\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          preview +
          `\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });

      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});
    } catch (e) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, { text: `❌ *Scrape échoué*\n${e.message}` }, { msgOptions: { quoted: msg } });
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// .shorturl [lien] — Raccourcir un lien
// ─────────────────────────────────────────────────────────────────────────────
const shorturl = {
  name: 'shorturl',
  aliases: ['short', 'shorten', 'raccourcir'],
  usage: '.shorturl [url]',
  category: 'web',
  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan } = ctx;
    let url = args[0]?.trim();
    if (!url) {
      return antiBan.safeSend(sock, jid, {
        text: '🔗 *.shorturl [url]*\nEx : *.shorturl https://monlonglien.com/page/...*',
      }, { msgOptions: { quoted: msg } });
    }
    if (!url.startsWith('http')) url = 'https://' + url;

    try {
      await sock.sendMessage(jid, { react: { text: '🔗', key: msg.key } }).catch(() => {});

      let shortLink = null;

      // Essai 1 : tinyurl (sans clé)
      try {
        const r = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, { timeout: T });
        if (r.data?.startsWith('http')) shortLink = r.data.trim();
      } catch (e) {}

      // Essai 2 : is.gd (sans clé)
      if (!shortLink) {
        try {
          const r = await axios.get(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`, { timeout: T });
          if (r.data?.startsWith('http')) shortLink = r.data.trim();
        } catch (e) {}
      }

      // Essai 3 : cleanuri.com
      if (!shortLink) {
        try {
          const r = await axios.post('https://cleanuri.com/api/v1/shorten',
            `url=${encodeURIComponent(url)}`,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: T }
          );
          if (r.data?.result_url) shortLink = r.data.result_url;
        } catch (e) {}
      }

      if (!shortLink) throw new Error('Tous les services de raccourcissement ont échoué.');

      await antiBan.safeSend(sock, jid, {
        text:
          `🔗 *LIEN RACCOURCI*\n\n` +
          `📎 Original : ${url.slice(0, 60)}${url.length > 60 ? '...' : ''}\n` +
          `✅ Court    : *${shortLink}*\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });

      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});
    } catch (e) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, { text: `❌ ${e.message}` }, { msgOptions: { quoted: msg } });
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// .ipinfo [IP ou domaine] — Infos complètes sur une IP
// ─────────────────────────────────────────────────────────────────────────────
const ipinfo = {
  name: 'ipinfo',
  aliases: ['geoip', 'ipdetails'],
  usage: '.ipinfo [IP ou domaine]',
  category: 'web',
  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan } = ctx;
    const target = args[0]?.trim();
    if (!target) {
      return antiBan.safeSend(sock, jid, {
        text: '🌍 *.ipinfo [IP ou domaine]*\nEx : *.ipinfo 8.8.8.8*\nEx : *.ipinfo google.com*',
      }, { msgOptions: { quoted: msg } });
    }

    try {
      await sock.sendMessage(jid, { react: { text: '🌍', key: msg.key } }).catch(() => {});

      // ip-api.com (gratuit, 45 req/min sans clé)
      const res = await axios.get(
        `http://ip-api.com/json/${encodeURIComponent(target)}?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query`,
        { timeout: T }
      );
      const d = res.data;

      if (d.status === 'fail') throw new Error(d.message || 'IP/domaine introuvable.');

      const flag = d.countryCode
        ? String.fromCodePoint(...[...d.countryCode.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65))
        : '🌍';

      await antiBan.safeSend(sock, jid, {
        text:
          `🌍 *IP INFO — ${d.query}*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `${flag} *Pays :* ${d.country} (${d.countryCode})\n` +
          `🏙️ *Ville :* ${d.city}, ${d.regionName}\n` +
          `📮 *Code postal :* ${d.zip || 'N/A'}\n` +
          `📍 *Coordonnées :* ${d.lat}, ${d.lon}\n` +
          `🕐 *Timezone :* ${d.timezone}\n` +
          `🏢 *ISP :* ${d.isp}\n` +
          `🔌 *Org :* ${d.org}\n` +
          `🔢 *AS :* ${d.as}\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });

      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});
    } catch (e) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, { text: `❌ *IPInfo échoué*\n${e.message}` }, { msgOptions: { quoted: msg } });
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// .headers [url] — En-têtes HTTP d'un site
// ─────────────────────────────────────────────────────────────────────────────
const headers = {
  name: 'headers',
  aliases: ['httpheaders', 'siteheaders'],
  usage: '.headers [url]',
  category: 'web',
  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan } = ctx;
    let url = args[0]?.trim();
    if (!url) {
      return antiBan.safeSend(sock, jid, {
        text: '📡 *.headers [url]*\nEx : *.headers https://google.com*',
      }, { msgOptions: { quoted: msg } });
    }
    if (!url.startsWith('http')) url = 'https://' + url;

    try {
      await sock.sendMessage(jid, { react: { text: '📡', key: msg.key } }).catch(() => {});

      const res = await axios.head(url, {
        timeout: T,
        headers: { 'User-Agent': 'Mozilla/5.0' },
        maxRedirects: 5,
        validateStatus: () => true,
      });

      const h         = res.headers;
      const important = [
        'server', 'content-type', 'content-length', 'cache-control',
        'x-powered-by', 'strict-transport-security', 'x-frame-options',
        'x-xss-protection', 'x-content-type-options', 'cf-ray', 'via',
      ];

      const lines = important
        .filter(k => h[k])
        .map(k => `▸ *${k}:* \`${String(h[k]).slice(0, 80)}\``)
        .join('\n');

      await antiBan.safeSend(sock, jid, {
        text:
          `📡 *EN-TÊTES HTTP — ${url.slice(0, 50)}*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `📊 Statut : *${res.status} ${res.statusText || ''}*\n\n` +
          (lines || '_(Aucun en-tête notable)_') +
          `\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });

      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});
    } catch (e) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, { text: `❌ *Headers échoué*\n${e.message}` }, { msgOptions: { quoted: msg } });
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// .sitestatus [url] — Vérifier si un site est en ligne
// ─────────────────────────────────────────────────────────────────────────────
const sitestatus = {
  name: 'sitestatus',
  aliases: ['isup', 'isdown', 'updown'],
  usage: '.sitestatus [url]',
  category: 'web',
  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan } = ctx;
    let url = args[0]?.trim();
    if (!url) {
      return antiBan.safeSend(sock, jid, {
        text: '🔌 *.sitestatus [url]*\nVérifie si un site est en ligne.\nEx : *.sitestatus https://google.com*',
      }, { msgOptions: { quoted: msg } });
    }
    if (!url.startsWith('http')) url = 'https://' + url;

    try {
      await sock.sendMessage(jid, { react: { text: '🔌', key: msg.key } }).catch(() => {});

      const start  = Date.now();
      let status   = '❌ HORS LIGNE';
      let code     = 'N/A';
      let ping     = 'N/A';
      let isOnline = false;

      try {
        const res = await axios.get(url, {
          timeout:        10000,
          validateStatus: () => true,
          headers:        { 'User-Agent': 'Mozilla/5.0' },
          maxRedirects:   3,
        });
        ping     = `${Date.now() - start}ms`;
        code     = res.status;
        isOnline = res.status < 500;
        status   = isOnline ? '✅ EN LIGNE' : '⚠️ ERREUR SERVEUR';
      } catch (e) {
        ping = `${Date.now() - start}ms`;
      }

      // Double check via isitup.org
      let doubleCheck = '';
      try {
        const r = await axios.get(`https://isitup.org/${new URL(url).hostname}.json`, { timeout: 8000 });
        const statusCode = r.data?.status_code;
        if (statusCode === 1)      doubleCheck = '\n🌍 _isitup.org confirme : EN LIGNE_';
        else if (statusCode === 2) doubleCheck = '\n🌍 _isitup.org confirme : HORS LIGNE_';
      } catch (e) {}

      await antiBan.safeSend(sock, jid, {
        text:
          `🔌 *STATUT DU SITE*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `🌐 *URL :* ${url}\n` +
          `📊 *Statut :* ${status}\n` +
          `🔢 *Code HTTP :* ${code}\n` +
          `⚡ *Temps de réponse :* ${ping}` +
          doubleCheck +
          `\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });

      await sock.sendMessage(jid, { react: { text: isOnline ? '✅' : '❌', key: msg.key } }).catch(() => {});
    } catch (e) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, { text: `❌ Erreur : ${e.message}` }, { msgOptions: { quoted: msg } });
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// .pastebin [texte] — Créer un paste public
// ─────────────────────────────────────────────────────────────────────────────
const pastebin = {
  name: 'pastebin',
  aliases: ['paste', 'hastebin'],
  usage: '.pastebin [texte]',
  category: 'web',
  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan } = ctx;
    const text = args.join(' ').trim();
    if (!text) {
      return antiBan.safeSend(sock, jid, {
        text: '📋 *.pastebin [texte]*\nCrée un lien public pour partager du texte.\nEx : *.pastebin Mon code ici...*',
      }, { msgOptions: { quoted: msg } });
    }

    try {
      await sock.sendMessage(jid, { react: { text: '📋', key: msg.key } }).catch(() => {});

      let pasteUrl = null;

      // Essai 1 : dpaste.com (gratuit, sans clé)
      try {
        const r = await axios.post('https://dpaste.com/api/v2/',
          new URLSearchParams({ content: text, syntax: 'text', expiry_days: 7 }).toString(),
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: T }
        );
        if (r.data && typeof r.data === 'string' && r.data.startsWith('http')) {
          pasteUrl = r.data.trim();
        }
      } catch (e) {}

      // Essai 2 : hastebin.com
      if (!pasteUrl) {
        try {
          const r = await axios.post('https://hastebin.com/documents', text, {
            headers: { 'Content-Type': 'text/plain' }, timeout: T,
          });
          if (r.data?.key) pasteUrl = `https://hastebin.com/${r.data.key}`;
        } catch (e) {}
      }

      if (!pasteUrl) throw new Error('Impossible de créer le paste. Réessaie plus tard.');

      await antiBan.safeSend(sock, jid, {
        text:
          `📋 *PASTE CRÉÉ*\n\n` +
          `🔗 Lien : *${pasteUrl}*\n` +
          `📏 Taille : ${text.length} caractères\n` +
          `⏱️ Expire : dans 7 jours\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });

      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});
    } catch (e) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, { text: `❌ *Pastebin échoué*\n${e.message}` }, { msgOptions: { quoted: msg } });
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// .searchimg [query] — Recherche d'images sur le web
// ─────────────────────────────────────────────────────────────────────────────
const searchimg = {
  name: 'searchimg',
  aliases: ['imgweb2', 'imgweb'],
  usage: '.searchimg [recherche]',
  category: 'web',
  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan } = ctx;
    const query = args.join(' ').trim();
    if (!query) {
      return antiBan.safeSend(sock, jid, {
        text: '🖼️ *.searchimg [recherche]*\nEx : *.searchimg coucher de soleil Dakar*',
      }, { msgOptions: { quoted: msg } });
    }

    try {
      await sock.sendMessage(jid, { react: { text: '🖼️', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, { text: `🔍 Recherche image : *${query}*...` }, { msgOptions: { quoted: msg } });

      // Unsplash Source (gratuit, sans clé)
      const cleanQ = encodeURIComponent(query);
      const imgUrl = `https://source.unsplash.com/1280x720/?${cleanQ}`;

      const res = await axios.get(imgUrl, {
        responseType: 'arraybuffer', timeout: 20000,
        headers: { 'User-Agent': 'Mozilla/5.0' },
        maxRedirects: 5,
      });
      const buf = Buffer.from(res.data);

      if (buf.length < 5000) throw new Error('Image non trouvée pour cette recherche.');

      await sock.sendMessage(jid, {
        image:    buf,
        caption:  `🖼️ *Résultat pour :* _${query}_\n\n> *ZERO TRACE BOT v5.0*`,
        mimetype: 'image/jpeg',
      }, { quoted: msg });

      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});
    } catch (e) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, { text: `❌ *Recherche image échouée*\n${e.message}` }, { msgOptions: { quoted: msg } });
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────
module.exports = { screenshot, scrape, shorturl, ipinfo, headers, sitestatus, pastebin, searchimg };
