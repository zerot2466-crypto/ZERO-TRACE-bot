/**
 * ZERO TRACE BOT v5.0 — osint.js (version améliorée)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * OSINT & Reconnaissance — réservé OWNER / SUDO uniquement
 *
 * Commandes :
 *   .whois [domaine/ip]       — infos registrar
 *   .dns [domaine] [type]     — enregistrements DNS complets
 *   .ssl [domaine]            — certificat SSL détaillé
 *   .subdomains [domaine]     — sous-domaines via crt.sh
 *   .wayback [url]            — archive Wayback Machine
 *   .pwned [email/password]   — fuites de données (HaveIBeenPwned)
 *   .iplookup [ip]            — géoloc + ASN + proxy détection
 *   .ipgeo [ip]               — alias iplookup
 */
'use strict';

const axios  = require('axios');
const crypto = require('crypto');

const TIMEOUT = 15000;
const BOT_TAG = '> ⚡ _ZERO TRACE BOT v5.0 — OSINT_';

// ── Validation ────────────────────────────────────────────────────────────────
function isValidDomain(d) {
  return /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/.test(d);
}
function isValidIP(ip) {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) || /^[0-9a-fA-F:]{3,39}$/.test(ip);
}
function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}
function cleanTarget(t) {
  return (t || '').trim().toLowerCase().replace(/https?:\/\//g, '').split('/')[0];
}

// ── Guard owner/sudo ──────────────────────────────────────────────────────────
function guardOwner(ctx) {
  if (ctx.isOwnerContext || ctx.msg?.key?.fromMe) return true;
  return ctx.isOwner || ctx.isSudo || ctx.isGroupAdmin || ctx.msg?.key?.fromMe;
}
async function denyAccess(ctx) {
  await ctx.antiBan.safeSend(ctx.sock, ctx.jid, {
    text: '🔒 Commande réservée au *propriétaire* et aux *sudos* uniquement.\n\n' + BOT_TAG,
  }, { msgOptions: { quoted: ctx.msg } });
}

// ─────────────────────────────────────────────────────────────────────────────
// WHOIS — informations registrar domaine/IP
// ─────────────────────────────────────────────────────────────────────────────
const whois = {
  name: 'whois',
  execute: async (ctx) => {
    if (!guardOwner(ctx)) return denyAccess(ctx);
    const { sock, jid, msg, antiBan, args, isGroupAdmin, isOwnerContext} = ctx;
    const target = cleanTarget(args[0]);

    if (!target || (!isValidDomain(target) && !isValidIP(target))) {
      await antiBan.safeSend(sock, jid, {
        text:
          '🔍 *WHOIS*\n\n' +
          'Usage : `.whois [domaine ou IP]`\n' +
          'Ex : `.whois google.com` · `.whois 8.8.8.8`\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    try {
      await sock.sendMessage(jid, { react: { text: '🔍', key: msg.key } }).catch(() => {});

      // API principale
      const res  = await axios.get(
        `https://api.whois.vu/?q=${encodeURIComponent(target)}`,
        { timeout: TIMEOUT }
      );
      const d = res.data;
      const lines = [];
      if (d.registrar)           lines.push(`🏢 Registrar      : ${d.registrar}`);
      if (d.created)             lines.push(`📅 Créé           : ${d.created}`);
      if (d.expires)             lines.push(`⏳ Expire         : ${d.expires}`);
      if (d.updated)             lines.push(`🔄 Mis à jour     : ${d.updated}`);
      if (d.registrant_name)     lines.push(`👤 Propriétaire   : ${d.registrant_name}`);
      if (d.registrant_email)    lines.push(`📧 Email          : ${d.registrant_email}`);
      if (d.registrant_country)  lines.push(`🌍 Pays           : ${d.registrant_country}`);
      if (d.registrant_org)      lines.push(`🏛️ Organisation   : ${d.registrant_org}`);
      if (d.name_servers?.length) lines.push(`🖥️ Nameservers    :\n  ${d.name_servers.slice(0, 4).map(n => '• ' + n).join('\n  ')}`);
      if (d.dnssec)              lines.push(`🔐 DNSSEC         : ${d.dnssec}`);
      if (d.status)              lines.push(`📊 Statut         : ${Array.isArray(d.status) ? d.status[0] : d.status}`);

      await antiBan.safeSend(sock, jid, {
        text:
          `🔍 *WHOIS — ${target.toUpperCase()}*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          (lines.length ? lines.join('\n') : '⚠️ Données WHOIS limitées (domaine protégé ?)') +
          `\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });

    } catch (e) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ WHOIS échoué pour *${target}*\n\`${e.message}\`\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// IPLOOKUP — géolocalisation IP + ASN + détection proxy/VPN
// ─────────────────────────────────────────────────────────────────────────────
async function _doIpLookup(ip) {
  const res = await axios.get(
    `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,proxy,hosting,query`,
    { timeout: TIMEOUT }
  );
  return res.data;
}

const iplookup = {
  name: 'iplookup',
  execute: async (ctx) => {
    if (!guardOwner(ctx)) return denyAccess(ctx);
    const { sock, jid, msg, antiBan, args } = ctx;
    const ip = (args[0] || '').trim();

    if (!ip || !isValidIP(ip)) {
      await antiBan.safeSend(sock, jid, {
        text:
          '🌐 *IP LOOKUP*\n\n' +
          'Usage : `.iplookup [adresse IP]`\n' +
          'Ex : `.iplookup 8.8.8.8`\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    try {
      await sock.sendMessage(jid, { react: { text: '🌐', key: msg.key } }).catch(() => {});
      const d = await _doIpLookup(ip);
      if (d.status === 'fail') throw new Error(d.message);

      const riskLevel = d.proxy ? '🚨 PROXY/VPN détecté' : d.hosting ? '⚠️ IP hébergeur' : '✅ IP résidentielle';

      await antiBan.safeSend(sock, jid, {
        text:
          `🌐 *IP LOOKUP — ${ip}*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `🌍 Pays        : ${d.country} (${d.countryCode})\n` +
          `🏙️ Ville       : ${d.city}, ${d.regionName}\n` +
          `📮 Code postal : ${d.zip || 'N/A'}\n` +
          `📍 GPS         : ${d.lat}, ${d.lon}\n` +
          `⏰ Timezone    : ${d.timezone}\n` +
          `🏢 FAI         : ${d.isp}\n` +
          `🏛️ Org         : ${d.org || 'N/A'}\n` +
          `📡 ASN         : ${d.as || 'N/A'}\n` +
          `🔰 Risque      : ${riskLevel}\n\n` +
          BOT_TAG,
      }, { msgOptions: { quoted: msg } });

    } catch (e) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ IP Lookup échoué : \`${e.message}\`\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
    }
  },
};

const ipgeo = { name: 'ipgeo', execute: iplookup.execute };

// ─────────────────────────────────────────────────────────────────────────────
// DNS LOOKUP — tous les types d'enregistrements
// ─────────────────────────────────────────────────────────────────────────────
const dnslookup = {
  name: 'dnslookup',
  execute: async (ctx) => {
    if (!guardOwner(ctx)) return denyAccess(ctx);
    const { sock, jid, msg, antiBan, args } = ctx;
    const domain = cleanTarget(args[0]);
    const type   = (args[1] || 'A').toUpperCase();
    const validTypes = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA', 'PTR', 'CAA', 'SRV'];

    if (!domain || !isValidDomain(domain)) {
      await antiBan.safeSend(sock, jid, {
        text:
          `🔎 *DNS LOOKUP*\n\n` +
          `Usage : \`.dns [domaine] [type]\`\n` +
          `Types : ${validTypes.join(' · ')}\n` +
          `Ex : \`.dns google.com MX\`\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }
    if (!validTypes.includes(type)) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ Type invalide. Utilise : ${validTypes.join(', ')}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    try {
      await sock.sendMessage(jid, { react: { text: '🔎', key: msg.key } }).catch(() => {});
      const res  = await axios.get(
        `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`,
        { timeout: TIMEOUT }
      );
      const data = res.data;

      if (!data.Answer?.length) {
        await antiBan.safeSend(sock, jid, {
          text: `🔎 *DNS ${type} — ${domain}*\n\nAucun enregistrement ${type} trouvé.\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      const records = data.Answer
        .map(r => `  • \`${r.data}\` _(TTL: ${r.TTL}s)_`)
        .join('\n');

      await antiBan.safeSend(sock, jid, {
        text:
          `🔎 *DNS ${type} — ${domain}*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `${records}\n\n` +
          `📊 ${data.Answer.length} enregistrement(s)\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });

    } catch (e) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ DNS lookup échoué : \`${e.message}\`\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SSL — vérification certificat détaillée
// ─────────────────────────────────────────────────────────────────────────────
const ssl = {
  name: 'ssl',
  execute: async (ctx) => {
    if (!guardOwner(ctx)) return denyAccess(ctx);
    const { sock, jid, msg, antiBan, args } = ctx;
    const domain = cleanTarget(args[0]);

    if (!domain || !isValidDomain(domain)) {
      await antiBan.safeSend(sock, jid, {
        text: '🔒 *SSL CHECK*\n\nUsage : `.ssl [domaine]`\nEx : `.ssl google.com`\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    try {
      await sock.sendMessage(jid, { react: { text: '🔒', key: msg.key } }).catch(() => {});
      const res = await axios.get(
        `https://ssl-checker.io/api/v1/check/${domain}`,
        { timeout: TIMEOUT, headers: { 'User-Agent': 'ZeroTraceBot/5.0' } }
      );
      const d = res.data;
      const daysLeft = d.days_remaining ?? '?';
      const status   = d.valid
        ? (typeof daysLeft === 'number' && daysLeft > 30
            ? `✅ Valide (${daysLeft} jours restants)`
            : `⚠️ Expire bientôt ! (${daysLeft}j)`)
        : '❌ Invalide / Expiré';

      await antiBan.safeSend(sock, jid, {
        text:
          `🔒 *SSL — ${domain}*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `État      : ${status}\n` +
          `Émetteur  : ${d.issuer || 'N/A'}\n` +
          `Expire    : ${d.expires || 'N/A'}\n` +
          `Protocole : ${d.protocol || 'N/A'}\n` +
          `Grade     : ${d.grade || 'N/A'}\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });

    } catch (e) {
      // Fallback : simple HEAD HTTPS
      try {
        await axios.head(`https://${domain}`, { timeout: 8000, maxRedirects: 3 });
        await antiBan.safeSend(sock, jid, {
          text:
            `🔒 *SSL — ${domain}*\n\n` +
            `✅ HTTPS accessible (certificat valide)\n` +
            `_Détails complets indisponibles — API externe hors ligne_\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
      } catch {
        await antiBan.safeSend(sock, jid, {
          text: `❌ SSL check échoué pour *${domain}*\nSite inaccessible ou certificat invalide.\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
      }
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PWNED — email dans des fuites + mot de passe via k-anonymity
// ─────────────────────────────────────────────────────────────────────────────
const pwned = {
  name: 'pwned',
  execute: async (ctx) => {
    if (!guardOwner(ctx)) return denyAccess(ctx);
    const { sock, jid, msg, antiBan, args } = ctx;
    const input = args.join(' ').trim();

    if (!input) {
      await antiBan.safeSend(sock, jid, {
        text:
          '🛡️ *PWNED CHECK*\n\n' +
          'Usage :\n' +
          '• `.pwned [email]` → fuites liées à un email\n' +
          '• `.pwned [mot de passe]` → hash check anonyme\n\n' +
          '🔐 La vérification est anonyme (k-anonymity SHA1)\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    try {
      await sock.sendMessage(jid, { react: { text: '🛡️', key: msg.key } }).catch(() => {});

      if (isValidEmail(input)) {
        // Vérification email via LeakCheck (API publique gratuite)
        try {
          const res = await axios.get(
            `https://leakcheck.io/api/public?check=${encodeURIComponent(input)}`,
            { timeout: TIMEOUT, headers: { 'User-Agent': 'ZeroTraceBot/5.0' } }
          );
          const d = res.data;
          if (d.found > 0) {
            const sources = (d.sources || []).slice(0, 8).map(s => `  • ${s.name} (${s.date || 'N/A'})`).join('\n');
            await antiBan.safeSend(sock, jid, {
              text:
                `🚨 *PWNED — ${input}*\n` +
                `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `❌ Email trouvé dans *${d.found}* fuite(s) !\n\n` +
                `📋 Sources :\n${sources || '  (liste non disponible)'}\n\n` +
                `⚠️ Change tes mots de passe immédiatement !\n\n` + BOT_TAG,
            }, { msgOptions: { quoted: msg } });
          } else {
            await antiBan.safeSend(sock, jid, {
              text:
                `✅ *PWNED — ${input}*\n\n` +
                `Cet email n'a pas été trouvé dans les fuites connues.\n` +
                `_Reste vigilant, toutes les fuites ne sont pas publiques._\n\n` + BOT_TAG,
            }, { msgOptions: { quoted: msg } });
          }
        } catch {
          // Fallback : juste le check password
          await antiBan.safeSend(sock, jid, {
            text: `⚠️ Vérification email indisponible. Essaie : https://haveibeenpwned.com/account/${encodeURIComponent(input)}\n\n` + BOT_TAG,
          }, { msgOptions: { quoted: msg } });
        }

      } else {
        // Vérification mot de passe via k-anonymity (HaveIBeenPwned Passwords)
        const sha1   = crypto.createHash('sha1').update(input).digest('hex').toUpperCase();
        const prefix = sha1.slice(0, 5);
        const suffix = sha1.slice(5);
        const res    = await axios.get(
          `https://api.pwnedpasswords.com/range/${prefix}`,
          { timeout: TIMEOUT, headers: { 'User-Agent': 'ZeroTraceBot/5.0', 'Add-Padding': 'true' } }
        );
        const lines = res.data.split('\n');
        const match = lines.find(l => l.toUpperCase().startsWith(suffix));
        const count = match ? parseInt(match.split(':')[1]) : 0;

        if (count > 0) {
          await antiBan.safeSend(sock, jid, {
            text:
              `🚨 *PWNED — Mot de passe*\n` +
              `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
              `❌ Compromis *${count.toLocaleString('fr-FR')}* fois dans les fuites !\n\n` +
              `🔐 Change ce mot de passe partout où tu l'utilises.\n\n` + BOT_TAG,
          }, { msgOptions: { quoted: msg } });
        } else {
          await antiBan.safeSend(sock, jid, {
            text:
              `✅ *PWNED — Mot de passe*\n\n` +
              `Non trouvé dans les bases de fuites connues.\n` +
              `_Ça ne garantit pas qu'il est fort — utilise toujours des mots de passe uniques et longs._\n\n` + BOT_TAG,
          }, { msgOptions: { quoted: msg } });
        }
      }

    } catch (e) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ Erreur PWNED : \`${e.message}\`\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// WAYBACK — archive Wayback Machine
// ─────────────────────────────────────────────────────────────────────────────
const wayback = {
  name: 'wayback',
  execute: async (ctx) => {
    if (!guardOwner(ctx)) return denyAccess(ctx);
    const { sock, jid, msg, antiBan, args } = ctx;
    const url = (args[0] || '').trim().replace(/https?:\/\//g, '');

    if (!url) {
      await antiBan.safeSend(sock, jid, {
        text: '📸 *WAYBACK*\n\nUsage : `.wayback [url]`\nEx : `.wayback google.com`\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    try {
      await sock.sendMessage(jid, { react: { text: '📸', key: msg.key } }).catch(() => {});
      const res  = await axios.get(
        `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`,
        { timeout: TIMEOUT }
      );
      const snap = res.data.archived_snapshots?.closest;

      if (snap?.available) {
        const ts = snap.timestamp || '';
        const date = ts.length === 14
          ? `${ts.slice(0,4)}/${ts.slice(4,6)}/${ts.slice(6,8)} ${ts.slice(8,10)}:${ts.slice(10,12)}`
          : ts;
        await antiBan.safeSend(sock, jid, {
          text:
            `📸 *WAYBACK — ${url}*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `✅ Archive disponible\n` +
            `📅 Date     : ${date}\n` +
            `🌐 Statut   : HTTP ${snap.status}\n` +
            `🔗 Archive  : ${snap.url}\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
      } else {
        await antiBan.safeSend(sock, jid, {
          text: `📸 *WAYBACK — ${url}*\n\n❌ Aucune archive disponible.\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
      }
    } catch (e) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ Wayback erreur : \`${e.message}\`\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBDOMAINS — enumération via crt.sh (Certificate Transparency)
// ─────────────────────────────────────────────────────────────────────────────
const subdomains = {
  name: 'subdomains',
  execute: async (ctx) => {
    if (!guardOwner(ctx)) return denyAccess(ctx);
    const { sock, jid, msg, antiBan, args } = ctx;
    const domain = cleanTarget(args[0]);

    if (!domain || !isValidDomain(domain)) {
      await antiBan.safeSend(sock, jid, {
        text: '🔎 *SUBDOMAINS*\n\nUsage : `.subdomains [domaine]`\nEx : `.subdomains example.com`\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    try {
      await sock.sendMessage(jid, { react: { text: '🔎', key: msg.key } }).catch(() => {});
      const res  = await axios.get(
        `https://crt.sh/?q=%.${domain}&output=json`,
        { timeout: TIMEOUT + 5000, headers: { 'User-Agent': 'ZeroTraceBot/5.0' } }
      );
      const data = res.data;

      if (!data?.length) {
        await antiBan.safeSend(sock, jid, {
          text: `🔎 *SUBDOMAINS — ${domain}*\n\nAucun sous-domaine trouvé.\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      const subs = [...new Set(
        data
          .flatMap(e => (e.name_value || '').split('\n'))
          .filter(s => s.endsWith(`.${domain}`) && !s.startsWith('*'))
          .map(s => s.toLowerCase().trim())
      )].sort().slice(0, 25);

      const total = [...new Set(
        data.flatMap(e => (e.name_value || '').split('\n'))
          .filter(s => s.endsWith(`.${domain}`) && !s.startsWith('*'))
      )].length;

      await antiBan.safeSend(sock, jid, {
        text:
          `🔎 *SUBDOMAINS — ${domain}*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          (subs.length
            ? subs.map(s => `• \`${s}\``).join('\n')
            : 'Aucun sous-domaine public trouvé.') +
          `\n\n📊 ${subs.length} affichés / ${total} trouvés\n` +
          `🔗 Source : crt.sh (Certificate Transparency)\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });

    } catch (e) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ Subdomains erreur : \`${e.message}\`\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
    }
  },
};

module.exports = { whois, iplookup, ipgeo, dnslookup, ssl, pwned, wayback, subdomains };
