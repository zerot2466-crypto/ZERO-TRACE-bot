/**
 * ZERO TRACE BOT v5.0 — netsec.js
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Sécurité réseau & analyse — owner/sudo uniquement
 *
 * Commandes :
 *   .techstack [url]        — détecter les technos d'un site
 *   .dirbust [url]          — tester les répertoires courants
 *   .dnsenum [domaine]      — énumération DNS complète
 *   .apkinfo [nom app]      — infos sur une app Android (permissions, version)
 *
 * ⚠️ Usage éthique uniquement — tes propres cibles ou autorisation explicite.
 */
'use strict';

const axios = require('axios');
const dns   = require('dns').promises;

const TIMEOUT = 15000;
const BOT_TAG = '> ⚡ _ZERO TRACE BOT v5.0 — NETSEC_';

function guard(ctx) { return ctx.isOwner || ctx.isSudo || ctx.isGroupAdmin || ctx.msg?.key?.fromMe; }
async function deny(ctx) {
  await ctx.antiBan.safeSend(ctx.sock, ctx.jid, {
    text: '🔒 Commande réservée au *propriétaire* et aux *sudos*.\n\n' + BOT_TAG,
  }, { msgOptions: { quoted: ctx.msg } });
}
function cleanUrl(u) {
  u = (u || '').trim();
  if (!u.startsWith('http')) u = 'https://' + u;
  return u;
}
function cleanHost(u) {
  return (u || '').trim().toLowerCase().replace(/https?:\/\//g, '').split('/')[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// TECHSTACK — détecter les technologies d'un site web
// ─────────────────────────────────────────────────────────────────────────────

// Signatures de détection basées sur headers, HTML, cookies
const TECH_SIGNATURES = [
  // CMS
  { name: 'WordPress',   check: (h, b) => b.includes('wp-content') || b.includes('wp-json') },
  { name: 'Drupal',      check: (h, b) => b.includes('Drupal') || h['x-generator']?.includes('Drupal') },
  { name: 'Joomla',      check: (h, b) => b.includes('joomla') || b.includes('/administrator/') },
  { name: 'Shopify',     check: (h, b) => b.includes('cdn.shopify.com') || h['x-shopid'] },
  { name: 'Wix',         check: (h, b) => b.includes('wix.com') || b.includes('wixsite') },
  { name: 'Webflow',     check: (h, b) => b.includes('webflow.com') },
  { name: 'Ghost',       check: (h, b) => b.includes('ghost.io') || b.includes('/ghost/') },

  // Frameworks JS
  { name: 'React',       check: (h, b) => b.includes('__react') || b.includes('react-root') || b.includes('data-reactroot') },
  { name: 'Vue.js',      check: (h, b) => b.includes('__vue') || b.includes('data-v-') },
  { name: 'Angular',     check: (h, b) => b.includes('ng-version') || b.includes('ng-app') },
  { name: 'Next.js',     check: (h, b) => b.includes('__NEXT_DATA__') || b.includes('_next/') },
  { name: 'Nuxt.js',     check: (h, b) => b.includes('__nuxt') || b.includes('_nuxt/') },
  { name: 'Svelte',      check: (h, b) => b.includes('svelte') },
  { name: 'jQuery',      check: (h, b) => b.includes('jquery') },

  // Serveurs
  { name: 'Nginx',       check: (h) => h['server']?.toLowerCase().includes('nginx') },
  { name: 'Apache',      check: (h) => h['server']?.toLowerCase().includes('apache') },
  { name: 'Cloudflare',  check: (h) => h['cf-ray'] || h['server']?.includes('cloudflare') },
  { name: 'AWS',         check: (h) => h['x-amz-cf-id'] || h['x-amzn-requestid'] || h['server']?.includes('AmazonS3') },
  { name: 'Vercel',      check: (h) => h['x-vercel-id'] || h['server']?.includes('Vercel') },
  { name: 'Netlify',     check: (h) => h['x-nf-request-id'] || h['server']?.includes('Netlify') },

  // Langages backend
  { name: 'PHP',         check: (h) => h['x-powered-by']?.includes('PHP') },
  { name: 'ASP.NET',     check: (h) => h['x-powered-by']?.includes('ASP.NET') || h['x-aspnet-version'] },
  { name: 'Ruby',        check: (h) => h['x-powered-by']?.includes('Phusion Passenger') },

  // Analytics & tracking
  { name: 'Google Analytics', check: (h, b) => b.includes('google-analytics.com') || b.includes('gtag') },
  { name: 'Google Tag Manager', check: (h, b) => b.includes('googletagmanager') },
  { name: 'Facebook Pixel',    check: (h, b) => b.includes('connect.facebook.net') },

  // CDN & sécurité
  { name: 'Bootstrap',   check: (h, b) => b.includes('bootstrap') },
  { name: 'Tailwind',    check: (h, b) => b.includes('tailwind') },
  { name: 'Font Awesome', check: (h, b) => b.includes('font-awesome') || b.includes('fontawesome') },
];

const techstack = {
  name: 'techstack',
  execute: async (ctx) => {
    if (!guard(ctx)) return deny(ctx);
    const { sock, jid, msg, antiBan, args, isGroupAdmin} = ctx;

    const rawUrl = args[0];
    if (!rawUrl) {
      await antiBan.safeSend(sock, jid, {
        text:
          '🔬 *TECHSTACK*\n\n' +
          'Usage : `.techstack [url]`\n' +
          'Ex : `.techstack https://example.com`\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const url = cleanUrl(rawUrl);

    try {
      await sock.sendMessage(jid, { react: { text: '🔬', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, {
        text: `🔬 _Analyse de ${url}..._`,
      }, { msgOptions: { quoted: msg } });

      const res = await axios.get(url, {
        timeout: TIMEOUT,
        maxRedirects: 5,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ZeroTraceBot/5.0)' },
        validateStatus: () => true,
      });

      const headers = res.headers;
      const body    = (res.data || '').toString().toLowerCase().slice(0, 50000);

      const detected = TECH_SIGNATURES.filter(t => {
        try { return t.check(headers, body); } catch { return false; }
      }).map(t => t.name);

      // Infos supplémentaires
      const server    = headers['server'] || 'N/A';
      const powered   = headers['x-powered-by'] || 'N/A';
      const status    = res.status;
      const https     = url.startsWith('https');
      const hsts      = !!headers['strict-transport-security'];
      const csp       = !!headers['content-security-policy'];
      const xframe    = headers['x-frame-options'] || '❌ Absent';

      // Catégoriser les résultats
      const cats = {
        '🖥️ Serveur':     detected.filter(t => ['Nginx','Apache','Cloudflare','AWS','Vercel','Netlify'].includes(t)),
        '📦 CMS':          detected.filter(t => ['WordPress','Drupal','Joomla','Shopify','Wix','Webflow','Ghost'].includes(t)),
        '⚙️ Framework':   detected.filter(t => ['React','Vue.js','Angular','Next.js','Nuxt.js','Svelte','jQuery'].includes(t)),
        '🔧 Backend':      detected.filter(t => ['PHP','ASP.NET','Ruby'].includes(t)),
        '🎨 CSS/UI':       detected.filter(t => ['Bootstrap','Tailwind','Font Awesome'].includes(t)),
        '📊 Analytics':    detected.filter(t => t.includes('Google') || t.includes('Facebook')),
      };

      const catLines = Object.entries(cats)
        .filter(([, v]) => v.length)
        .map(([k, v]) => `${k} : ${v.join(' · ')}`)
        .join('\n');

      await antiBan.safeSend(sock, jid, {
        text:
          `🔬 *TECHSTACK — ${cleanHost(rawUrl)}*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `HTTP : ${status} | HTTPS : ${https ? '✅' : '❌'}\n` +
          `HSTS : ${hsts ? '✅' : '❌'} | CSP : ${csp ? '✅' : '❌'}\n` +
          `X-Frame-Options : ${xframe}\n` +
          `Server : ${server}\n` +
          (powered !== 'N/A' ? `X-Powered-By : ⚠️ ${powered}\n` : '') +
          `\n` +
          (catLines
            ? `📋 *Technologies détectées (${detected.length}) :*\n${catLines}`
            : `❓ Aucune technologie identifiée avec certitude.`) +
          `\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });

    } catch (e) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ TechStack échoué : \`${e.message}\`\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// DIRBUST — tester les répertoires et fichiers courants
// ─────────────────────────────────────────────────────────────────────────────
const COMMON_PATHS = [
  // Admin
  '/admin', '/administrator', '/wp-admin', '/wp-login.php', '/login',
  '/dashboard', '/panel', '/cpanel', '/phpmyadmin', '/adminer.php',
  // Config & backup
  '/.env', '/.git/HEAD', '/config.php', '/config.js', '/web.config',
  '/backup.zip', '/backup.sql', '/dump.sql', '/.htaccess',
  // API
  '/api', '/api/v1', '/api/v2', '/graphql', '/swagger', '/swagger-ui.html',
  '/api-docs', '/openapi.json', '/robots.txt', '/sitemap.xml',
  // Fichiers sensibles
  '/server-status', '/info.php', '/phpinfo.php', '/.DS_Store',
  '/package.json', '/composer.json', '/yarn.lock',
  // CMS
  '/wp-config.php', '/xmlrpc.php', '/wp-json/wp/v2/users',
  '/joomla.xml', '/sites/default/settings.php',
];

const dirbust = {
  name: 'dirbust',
  execute: async (ctx) => {
    if (!guard(ctx)) return deny(ctx);
    const { sock, jid, msg, antiBan, args } = ctx;

    const rawUrl = args[0];
    if (!rawUrl) {
      await antiBan.safeSend(sock, jid, {
        text:
          '📂 *DIRBUST*\n\n' +
          'Usage : `.dirbust [url]`\n' +
          'Ex : `.dirbust https://example.com`\n\n' +
          `⚠️ Teste ${COMMON_PATHS.length} chemins courants.\n` +
          'Utilise uniquement sur tes propres serveurs.\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const base = cleanUrl(rawUrl).replace(/\/$/, '');

    try {
      await sock.sendMessage(jid, { react: { text: '📂', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, {
        text: `📂 _Scan de ${COMMON_PATHS.length} chemins sur ${base}..._`,
      }, { msgOptions: { quoted: msg } });

      // Scanner par lots de 8 en parallèle
      const results = [];
      const batchSize = 8;

      for (let i = 0; i < COMMON_PATHS.length; i += batchSize) {
        const batch = COMMON_PATHS.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async (p) => {
            try {
              const res = await axios.get(base + p, {
                timeout: 5000,
                maxRedirects: 0,
                validateStatus: () => true,
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ZeroTraceBot/5.0)' },
              });
              return { path: p, status: res.status };
            } catch {
              return { path: p, status: 0 };
            }
          })
        );
        results.push(...batchResults);
      }

      // Trier par statut
      const found    = results.filter(r => r.status === 200);
      const redirect = results.filter(r => [301, 302, 307, 308].includes(r.status));
      const denied   = results.filter(r => r.status === 403);

      const formatList = (items, emoji) =>
        items.map(r => `${emoji} \`${r.path}\` (${r.status})`).join('\n');

      let text =
        `📂 *DIRBUST — ${cleanHost(rawUrl)}*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Testé : ${COMMON_PATHS.length} chemins\n\n`;

      if (found.length) {
        text += `✅ *Accessibles (200) — ${found.length} :*\n${formatList(found, '🟢')}\n\n`;
      }
      if (denied.length) {
        text += `🔒 *Protégés (403) — ${denied.length} :*\n${formatList(denied.slice(0, 8), '🔴')}\n\n`;
      }
      if (redirect.length) {
        text += `↪️ *Redirections — ${redirect.length} :*\n${formatList(redirect.slice(0, 5), '🟡')}\n\n`;
      }
      if (!found.length && !denied.length && !redirect.length) {
        text += `✅ Aucun chemin sensible trouvé.\n\n`;
      }

      text += BOT_TAG;

      await antiBan.safeSend(sock, jid, { text }, { msgOptions: { quoted: msg } });

    } catch (e) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ Dirbust échoué : \`${e.message}\`\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// DNS ENUM — énumération DNS complète (tous les types)
// ─────────────────────────────────────────────────────────────────────────────
const DNS_TYPES = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA', 'CAA', 'SRV'];

const dnsenum = {
  name: 'dnsenum',
  execute: async (ctx) => {
    if (!guard(ctx)) return deny(ctx);
    const { sock, jid, msg, antiBan, args } = ctx;

    const domain = cleanHost(args[0]);
    if (!domain || !/^[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,}$/.test(domain)) {
      await antiBan.safeSend(sock, jid, {
        text:
          '🗂️ *DNS ENUM*\n\n' +
          'Usage : `.dnsenum [domaine]`\n' +
          'Ex : `.dnsenum example.com`\n\n' +
          `Types interrogés : ${DNS_TYPES.join(' · ')}\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    try {
      await sock.sendMessage(jid, { react: { text: '🗂️', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, {
        text: `🗂️ _Énumération DNS de ${domain}..._`,
      }, { msgOptions: { quoted: msg } });

      // Requêtes parallèles pour tous les types
      const queries = DNS_TYPES.map(async (type) => {
        try {
          const res = await axios.get(
            `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`,
            { timeout: TIMEOUT }
          );
          const answers = res.data?.Answer || [];
          return { type, records: answers.map(r => r.data) };
        } catch {
          return { type, records: [] };
        }
      });

      const results = await Promise.all(queries);

      // Sous-domaines courants à tester
      const COMMON_SUBS = ['www', 'mail', 'ftp', 'smtp', 'pop', 'imap', 'vpn', 'api', 'dev', 'staging', 'test', 'admin', 'ns1', 'ns2', 'cdn', 'remote', 'mx'];
      const subResults = await Promise.all(
        COMMON_SUBS.map(async (sub) => {
          try {
            const res = await axios.get(
              `https://dns.google/resolve?name=${sub}.${domain}&type=A`,
              { timeout: 5000 }
            );
            if (res.data?.Answer?.length) {
              return `• \`${sub}.${domain}\` → ${res.data.Answer[0].data}`;
            }
          } catch {}
          return null;
        })
      );

      const activeSubs = subResults.filter(Boolean);

      // Construire la réponse
      let text =
        `🗂️ *DNS ENUM — ${domain}*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      for (const { type, records } of results) {
        if (records.length) {
          text += `*${type}* :\n${records.slice(0, 4).map(r => `  • \`${r.slice(0, 80)}\``).join('\n')}\n\n`;
        }
      }

      if (activeSubs.length) {
        text += `🌐 *Sous-domaines actifs (${activeSubs.length}) :*\n${activeSubs.join('\n')}\n\n`;
      } else {
        text += `🌐 Sous-domaines courants : aucun détecté\n\n`;
      }

      text += BOT_TAG;

      await antiBan.safeSend(sock, jid, { text }, { msgOptions: { quoted: msg } });

    } catch (e) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ DNS Enum échoué : \`${e.message}\`\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// APK INFO — informations sur une application Android
// ─────────────────────────────────────────────────────────────────────────────
const apkinfo = {
  name: 'apkinfo',
  execute: async (ctx) => {
    if (!guard(ctx)) return deny(ctx);
    const { sock, jid, msg, antiBan, args } = ctx;

    const query = args.join(' ').trim();
    if (!query) {
      await antiBan.safeSend(sock, jid, {
        text:
          '📱 *APK INFO*\n\n' +
          'Usage : `.apkinfo [nom ou package]`\n' +
          'Ex : `.apkinfo WhatsApp`\n' +
          'Ex : `.apkinfo com.whatsapp`\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    try {
      await sock.sendMessage(jid, { react: { text: '📱', key: msg.key } }).catch(() => {});

      // Détecter si c'est un package ID ou un nom
      const isPackage = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(query.toLowerCase());
      const searchQ   = isPackage ? query : query;

      // API Google Play (via scraping non-officiel)
      let appData = null;

      // Tentative 1 : gplay-scraper compatible via playstore-scraper API
      try {
        const searchRes = await axios.get(
          `https://play-store-api.vercel.app/api/search?term=${encodeURIComponent(searchQ)}&lang=fr&country=fr&num=3`,
          { timeout: TIMEOUT }
        );
        const apps = searchRes.data?.results || searchRes.data || [];
        if (Array.isArray(apps) && apps.length) appData = apps[0];
      } catch {}

      // Tentative 2 : API alternative serpapi-like
      if (!appData) {
        try {
          const res = await axios.get(
            `https://google-play-scraper-api.vercel.app/search?term=${encodeURIComponent(searchQ)}&num=1`,
            { timeout: TIMEOUT }
          );
          const results = res.data?.results || res.data || [];
          if (Array.isArray(results) && results.length) appData = results[0];
        } catch {}
      }

      if (appData) {
        const permCount = appData.permissions?.length || '?';
        const score     = appData.score ? `${appData.score.toFixed(1)}/5` : 'N/A';
        const installs  = appData.maxInstalls ? appData.maxInstalls.toLocaleString('fr-FR') : (appData.installs || 'N/A');
        const updated   = appData.updated ? new Date(appData.updated).toLocaleDateString('fr-FR') : 'N/A';
        const size      = appData.size || 'N/A';

        // Permissions à risque
        const dangerPerms = (appData.permissions || []).filter(p =>
          ['CAMERA', 'MICROPHONE', 'LOCATION', 'CONTACTS', 'SMS', 'CALL_LOG', 'READ_EXTERNAL', 'WRITE_EXTERNAL', 'RECORD_AUDIO'].some(d => p.toUpperCase().includes(d))
        );

        await antiBan.safeSend(sock, jid, {
          text:
            `📱 *APK INFO — ${appData.title || query}*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `📦 Package    : \`${appData.appId || appData.packageName || 'N/A'}\`\n` +
            `🏢 Développeur: ${appData.developer || 'N/A'}\n` +
            `⭐ Note       : ${score} (${appData.ratings ? appData.ratings.toLocaleString() : '?'} avis)\n` +
            `📥 Installs   : ${installs}\n` +
            `📦 Taille     : ${size}\n` +
            `🔄 Màj        : ${updated}\n` +
            `📱 Version    : ${appData.version || 'N/A'}\n` +
            `🔑 Perms      : ${permCount} permissions\n` +
            (dangerPerms.length
              ? `⚠️ *Perms sensibles :*\n${dangerPerms.slice(0, 6).map(p => `  • ${p}`).join('\n')}\n`
              : `✅ Aucune permission sensible détectée\n`) +
            `\n🔗 Play Store : https://play.google.com/store/apps/details?id=${appData.appId || ''}\n\n` +
            BOT_TAG,
        }, { msgOptions: { quoted: msg } });

      } else {
        // Fallback : donner le lien Play Store
        await antiBan.safeSend(sock, jid, {
          text:
            `📱 *APK INFO — ${query}*\n\n` +
            `⚠️ API Play Store indisponible.\n\n` +
            `🔗 Rechercher manuellement :\n` +
            `• https://play.google.com/store/search?q=${encodeURIComponent(query)}\n` +
            `• https://apkpure.com/search?q=${encodeURIComponent(query)}\n` +
            `• https://www.apkmirror.com/?s=${encodeURIComponent(query)}\n\n` +
            BOT_TAG,
        }, { msgOptions: { quoted: msg } });
      }

    } catch (e) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ APK info échoué : \`${e.message}\`\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
    }
  },
};

module.exports = { techstack, dirbust, dnsenum, apkinfo };
