/**
 * ZERO TRACE BOT v5.0 — devtools.js
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Outils développeur — owner/sudo uniquement
 *
 * Commandes :
 *   .regex [pattern] | [texte]   — tester une regex sur un texte
 *   .json [texte]                — formater / valider du JSON
 *   .diff [texte1] || [texte2]   — comparer deux textes ligne par ligne
 *   .uuid                        — générer des UUIDs v4
 *   .timestamp [date?]           — convertir timestamp ↔ date lisible
 *   .ipcidr [ip/cidr]            — infos sur un bloc réseau CIDR
 *   .coderun [lang] [code]       — exécuter du code via IA (sandbox simulé)
 *   .colorcode [hex/rgb]         — convertir des couleurs (hex/rgb/hsl)
 *   .lorem [n]                   — générer du faux texte lorem ipsum
 */
'use strict';

const crypto = require('crypto');
const axios  = require('axios');

const BOT_TAG = '> ⚡ _ZERO TRACE BOT v5.0 — DEVTOOLS_';

function guard(ctx) { return ctx.isOwner || ctx.isSudo || ctx.isGroupAdmin || ctx.msg?.key?.fromMe; }
async function deny(ctx) {
  await ctx.antiBan.safeSend(ctx.sock, ctx.jid, {
    text: '🔒 Commande réservée au *propriétaire* et aux *sudos*.\n\n' + BOT_TAG,
  }, { msgOptions: { quoted: ctx.msg } });
}

// ─────────────────────────────────────────────────────────────────────────────
// .regex — tester une expression régulière
// ─────────────────────────────────────────────────────────────────────────────
const regex = {
  name: 'regex',
  execute: async (ctx) => {
    if (!guard(ctx)) return deny(ctx);
    const { sock, jid, msg, antiBan, args, isGroupAdmin} = ctx;

    // Format : .regex [pattern] | [texte à tester]
    const full = args.join(' ');
    const sep  = full.indexOf('|');
    if (sep === -1) {
      await antiBan.safeSend(sock, jid, {
        text:
          '🔍 *REGEX TESTER*\n\n' +
          'Usage : `.regex [pattern] | [texte]`\n' +
          'Ex : `.regex ^\\d{4}$ | 2024`\n' +
          'Ex : `.regex [a-z]+ | Hello World`\n\n' +
          'Flags : ajoute `/flags` après le pattern\n' +
          'Ex : `.regex hello/i | Hello World`\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const rawPattern = full.slice(0, sep).trim();
    const testText   = full.slice(sep + 1).trim();

    // Extraire flags si présents (ex: pattern/gi)
    let pattern = rawPattern;
    let flags   = 'g';
    const flagMatch = rawPattern.match(/^(.+)\/([gimsuy]*)$/);
    if (flagMatch) {
      pattern = flagMatch[1];
      flags   = flagMatch[2] || 'g';
    }

    try {
      const re      = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
      const matches = [...testText.matchAll(re)];

      if (!matches.length) {
        await antiBan.safeSend(sock, jid, {
          text:
            `🔍 *REGEX — Aucune correspondance*\n\n` +
            `Pattern : \`/${pattern}/${flags}\`\n` +
            `Texte   : \`${testText.slice(0, 100)}\`\n\n` +
            `❌ Aucun match trouvé.\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      const matchList = matches.slice(0, 10).map((m, i) =>
        `${i + 1}. \`${m[0]}\` _(index: ${m.index})_` +
        (m.slice(1).length ? `\n   Groupes: ${m.slice(1).map(g => `\`${g}\``).join(', ')}` : '')
      ).join('\n');

      // Texte avec matches surlignés (entre >><<)
      const highlighted = testText.replace(re, '»$&«').slice(0, 200);

      await antiBan.safeSend(sock, jid, {
        text:
          `🔍 *REGEX — ${matches.length} match(es)*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `Pattern : \`/${pattern}/${flags}\`\n\n` +
          `📋 Correspondances :\n${matchList}\n\n` +
          `📝 Aperçu : ${highlighted}\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });

    } catch (e) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ Regex invalide : \`${e.message}\`\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// .json — formater / valider / minifier du JSON
// ─────────────────────────────────────────────────────────────────────────────
const jsonformat = {
  name: 'jsonformat',
  execute: async (ctx) => {
    if (!guard(ctx)) return deny(ctx);
    const { sock, jid, msg, antiBan, args } = ctx;

    // Récupérer aussi le texte cité
    const quoted    = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedTxt = quoted?.conversation || quoted?.extendedTextMessage?.text || '';
    const sub       = (args[0] || '').toLowerCase();

    let raw = '';
    if (sub === 'min' || sub === 'minify') {
      raw = args.slice(1).join(' ') || quotedTxt;
    } else if (sub === 'val' || sub === 'validate') {
      raw = args.slice(1).join(' ') || quotedTxt;
    } else {
      raw = args.join(' ') || quotedTxt;
    }

    raw = raw.trim();

    if (!raw) {
      await antiBan.safeSend(sock, jid, {
        text:
          '📦 *JSON TOOLS*\n\n' +
          'Usage :\n' +
          '`.json [texte]` — formater (pretty print)\n' +
          '`.json min [texte]` — minifier\n' +
          '`.json val [texte]` — valider seulement\n\n' +
          'Ou réponds à un message contenant du JSON.\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    try {
      const parsed = JSON.parse(raw);

      if (sub === 'min' || sub === 'minify') {
        const minified = JSON.stringify(parsed);
        await antiBan.safeSend(sock, jid, {
          text:
            `📦 *JSON MINIFIÉ*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `\`${minified.slice(0, 800)}${minified.length > 800 ? '...' : ''}\`\n\n` +
            `📊 ${raw.length} → ${minified.length} chars (-${Math.round((1 - minified.length / raw.length) * 100)}%)\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      if (sub === 'val' || sub === 'validate') {
        const keys  = typeof parsed === 'object' ? Object.keys(parsed).length : 0;
        const depth = (o, d = 0) => typeof o !== 'object' || o === null ? d : Math.max(...Object.values(o).map(v => depth(v, d + 1)));
        await antiBan.safeSend(sock, jid, {
          text:
            `✅ *JSON VALIDE*\n\n` +
            `Type       : ${Array.isArray(parsed) ? 'Array' : typeof parsed}\n` +
            `Clés racine: ${keys}\n` +
            `Profondeur : ${depth(parsed)}\n` +
            `Taille     : ${raw.length} chars\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      // Format pretty print
      const formatted = JSON.stringify(parsed, null, 2);
      await antiBan.safeSend(sock, jid, {
        text:
          `📦 *JSON FORMATÉ*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `\`\`\`\n${formatted.slice(0, 800)}${formatted.length > 800 ? '\n...(tronqué)' : ''}\n\`\`\`\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });

    } catch (e) {
      await antiBan.safeSend(sock, jid, {
        text:
          `❌ *JSON INVALIDE*\n\n` +
          `Erreur : \`${e.message}\`\n\n` +
          `💡 Vérifie les guillemets doubles, virgules, et crochets.\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// .diff — comparer deux textes
// ─────────────────────────────────────────────────────────────────────────────
const diff = {
  name: 'diff',
  execute: async (ctx) => {
    if (!guard(ctx)) return deny(ctx);
    const { sock, jid, msg, antiBan, args } = ctx;

    const full = args.join(' ');
    const sep  = full.indexOf('||');

    if (sep === -1) {
      await antiBan.safeSend(sock, jid, {
        text:
          '🔀 *DIFF*\n\n' +
          'Usage : `.diff [texte1] || [texte2]`\n' +
          'Ex : `.diff function hello() {} || function world() {}`\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const a = full.slice(0, sep).trim();
    const b = full.slice(sep + 2).trim();

    const linesA = a.split('\n');
    const linesB = b.split('\n');

    const result = [];
    const maxLen = Math.max(linesA.length, linesB.length);

    let added = 0, removed = 0, changed = 0;

    for (let i = 0; i < maxLen; i++) {
      const la = linesA[i];
      const lb = linesB[i];
      if (la === undefined) {
        result.push(`+ ${lb}`); added++;
      } else if (lb === undefined) {
        result.push(`- ${la}`); removed++;
      } else if (la !== lb) {
        result.push(`- ${la}`);
        result.push(`+ ${lb}`);
        changed++;
      } else {
        result.push(`  ${la}`);
      }
    }

    const diffText = result.slice(0, 30).join('\n');
    const identical = added === 0 && removed === 0 && changed === 0;

    await antiBan.safeSend(sock, jid, {
      text:
        `🔀 *DIFF*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        (identical
          ? `✅ Les deux textes sont *identiques*.\n\n`
          : `➕ Ajoutés   : ${added}\n➖ Supprimés : ${removed}\n✏️ Modifiés  : ${changed}\n\n\`\`\`\n${diffText}\n\`\`\`\n\n`) +
        BOT_TAG,
    }, { msgOptions: { quoted: msg } });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// .uuid — générateur UUID v4
// ─────────────────────────────────────────────────────────────────────────────
const uuid = {
  name: 'uuid',
  execute: async (ctx) => {
    if (!guard(ctx)) return deny(ctx);
    const { sock, jid, msg, antiBan, args } = ctx;

    const count = Math.min(parseInt(args[0]) || 5, 20);
    const uuids = Array.from({ length: count }, () => crypto.randomUUID());

    await antiBan.safeSend(sock, jid, {
      text:
        `🔑 *UUID v4 (${count} générés)*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        uuids.map((u, i) => `${i + 1}. \`${u}\``).join('\n') +
        `\n\n💡 Usage : \`.uuid [nombre]\` (max 20)\n\n` + BOT_TAG,
    }, { msgOptions: { quoted: msg } });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// .timestamp — conversion timestamp ↔ date
// ─────────────────────────────────────────────────────────────────────────────
const timestamp = {
  name: 'timestamp',
  execute: async (ctx) => {
    if (!guard(ctx)) return deny(ctx);
    const { sock, jid, msg, antiBan, args } = ctx;

    const input = args.join(' ').trim();
    const now   = new Date();

    // Pas d'argument → timestamp actuel
    if (!input) {
      await antiBan.safeSend(sock, jid, {
        text:
          `⏱️ *TIMESTAMP ACTUEL*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `Unix (s)  : \`${Math.floor(now.getTime() / 1000)}\`\n` +
          `Unix (ms) : \`${now.getTime()}\`\n` +
          `ISO 8601  : \`${now.toISOString()}\`\n` +
          `UTC       : \`${now.toUTCString()}\`\n` +
          `Local     : \`${now.toLocaleString('fr-FR')}\`\n\n` +
          `💡 \`.timestamp [unix ou date]\` pour convertir\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    let date;

    // Si c'est un nombre → c'est un timestamp Unix
    if (/^\d{10,13}$/.test(input)) {
      const ts = input.length === 13 ? parseInt(input) : parseInt(input) * 1000;
      date     = new Date(ts);
    } else {
      // Sinon c'est une date lisible
      date = new Date(input);
    }

    if (isNaN(date.getTime())) {
      await antiBan.safeSend(sock, jid, {
        text:
          `❌ Date invalide : \`${input}\`\n\n` +
          `Exemples valides :\n` +
          `• \`.timestamp 1700000000\`\n` +
          `• \`.timestamp 2024-01-15\`\n` +
          `• \`.timestamp 2024-01-15T10:30:00\`\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    await antiBan.safeSend(sock, jid, {
      text:
        `⏱️ *TIMESTAMP*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Entrée    : \`${input}\`\n\n` +
        `Unix (s)  : \`${Math.floor(date.getTime() / 1000)}\`\n` +
        `Unix (ms) : \`${date.getTime()}\`\n` +
        `ISO 8601  : \`${date.toISOString()}\`\n` +
        `UTC       : \`${date.toUTCString()}\`\n` +
        `Local     : \`${date.toLocaleString('fr-FR')}\`\n\n` + BOT_TAG,
    }, { msgOptions: { quoted: msg } });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// .ipcidr — analyse d'un bloc réseau CIDR
// ─────────────────────────────────────────────────────────────────────────────
function ipToInt(ip) {
  return ip.split('.').reduce((acc, o) => (acc << 8) + parseInt(o), 0) >>> 0;
}
function intToIp(n) {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}

const ipcidr = {
  name: 'ipcidr',
  execute: async (ctx) => {
    if (!guard(ctx)) return deny(ctx);
    const { sock, jid, msg, antiBan, args } = ctx;

    const input = (args[0] || '').trim();
    if (!input) {
      await antiBan.safeSend(sock, jid, {
        text:
          '🌐 *IP/CIDR*\n\n' +
          'Usage : `.ipcidr [ip/cidr]`\n' +
          'Ex : `.ipcidr 192.168.1.0/24`\n' +
          'Ex : `.ipcidr 10.0.0.1/8`\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    try {
      const [ipPart, prefixStr] = input.split('/');
      const prefix = parseInt(prefixStr ?? '32');

      if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ipPart) || isNaN(prefix) || prefix < 0 || prefix > 32) {
        throw new Error('Format invalide. Utilise: ip/cidr (ex: 192.168.0.0/24)');
      }

      const ipInt     = ipToInt(ipPart);
      const mask      = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
      const network   = (ipInt & mask) >>> 0;
      const broadcast = (network | ~mask) >>> 0;
      const firstHost = prefix < 31 ? network + 1 : network;
      const lastHost  = prefix < 31 ? broadcast - 1 : broadcast;
      const totalIPs  = Math.pow(2, 32 - prefix);
      const usable    = prefix < 31 ? totalIPs - 2 : totalIPs;

      const maskStr   = intToIp(mask);
      const wildcardStr = intToIp(~mask >>> 0);

      await antiBan.safeSend(sock, jid, {
        text:
          `🌐 *IP/CIDR — ${input}*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `Réseau       : \`${intToIp(network)}\`\n` +
          `Broadcast    : \`${intToIp(broadcast)}\`\n` +
          `1ère IP      : \`${intToIp(firstHost)}\`\n` +
          `Dernière IP  : \`${intToIp(lastHost)}\`\n` +
          `Masque       : \`${maskStr}\`\n` +
          `Wildcard     : \`${wildcardStr}\`\n` +
          `Préfixe      : \`/${prefix}\`\n` +
          `Total IPs    : \`${totalIPs.toLocaleString('fr-FR')}\`\n` +
          `IPs utilisables : \`${usable.toLocaleString('fr-FR')}\`\n` +
          `Classe       : ${prefix <= 8 ? 'A' : prefix <= 16 ? 'B' : prefix <= 24 ? 'C' : 'VLAN/sous-réseau'}\n\n` +
          BOT_TAG,
      }, { msgOptions: { quoted: msg } });

    } catch (e) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ CIDR invalide : \`${e.message}\`\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// .coderun — exécuter du code via IA (sandbox simulé + explication)
// ─────────────────────────────────────────────────────────────────────────────
const SUPPORTED_LANGS = ['python', 'js', 'javascript', 'bash', 'php', 'go', 'rust', 'c', 'cpp', 'java', 'ruby', 'sql'];

const coderun = {
  name: 'coderun',
  execute: async (ctx) => {
    if (!guard(ctx)) return deny(ctx);
    const { sock, jid, msg, antiBan, args } = ctx;

    const lang = (args[0] || '').toLowerCase();
    const code = args.slice(1).join(' ').trim();

    // Vérifier si code cité dans un message
    const quoted    = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedTxt = quoted?.conversation || quoted?.extendedTextMessage?.text || '';
    const finalCode = code || quotedTxt;

    if (!lang || !SUPPORTED_LANGS.includes(lang) || !finalCode) {
      await antiBan.safeSend(sock, jid, {
        text:
          '💻 *CODERUN*\n\n' +
          'Usage : `.coderun [lang] [code]`\n' +
          'Ou réponds à un message de code avec `.coderun [lang]`\n\n' +
          `Langages : ${SUPPORTED_LANGS.join(' · ')}\n\n` +
          'Ex : `.coderun python print("hello")`\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    try {
      await sock.sendPresenceUpdate('composing', jid).catch(() => {});
      await antiBan.safeSend(sock, jid, {
        text: `💻 _Analyse du code ${lang.toUpperCase()}..._`,
      }, { msgOptions: { quoted: msg } });

      const prompt =
        `Tu es un interpréteur de code expert. Analyse et simule l'exécution de ce code ${lang} :\n\n` +
        `\`\`\`${lang}\n${finalCode}\n\`\`\`\n\n` +
        `Réponds EXACTEMENT dans ce format (texte brut, pas de markdown) :\n` +
        `SORTIE:\n[ce que le code affiche/retourne]\n\n` +
        `EXPLICATION:\n[explication courte de ce que fait le code]\n\n` +
        `BUGS:\n[bugs ou problèmes potentiels, ou "Aucun" si le code est correct]\n\n` +
        `OPTIMISATION:\n[suggestion d'amélioration si pertinent, sinon "Code correct"]`;

      const aiLib = require('../lib/openrouter_ai');
      const result = await aiLib.chat([{ role: 'user', content: prompt }], {
        system: 'Tu es un interpréteur de code. Réponds toujours en français. Sois précis et concis.',
      });

      await antiBan.safeSend(sock, jid, {
        text:
          `💻 *CODERUN — ${lang.toUpperCase()}*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `📝 Code :\n\`${finalCode.slice(0, 300)}${finalCode.length > 300 ? '...' : ''}\`\n\n` +
          `${result.slice(0, 1000)}\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });

    } catch (e) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ Coderun échoué : \`${e.message}\`\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
    } finally {
      await sock.sendPresenceUpdate('paused', jid).catch(() => {});
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// .colorcode — convertir des couleurs hex/rgb/hsl
// ─────────────────────────────────────────────────────────────────────────────
const colorcode = {
  name: 'colorcode',
  execute: async (ctx) => {
    if (!guard(ctx)) return deny(ctx);
    const { sock, jid, msg, antiBan, args } = ctx;

    const input = args.join(' ').trim();
    if (!input) {
      await antiBan.safeSend(sock, jid, {
        text:
          '🎨 *COLOR CONVERT*\n\n' +
          'Usage :\n' +
          '`.colorcode #FF5733`\n' +
          '`.colorcode rgb(255, 87, 51)`\n' +
          '`.colorcode 255 87 51`\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    try {
      let r, g, b;

      // HEX
      const hexMatch = input.match(/^#?([a-f0-9]{6}|[a-f0-9]{3})$/i);
      if (hexMatch) {
        let hex = hexMatch[1];
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
      }

      // RGB
      const rgbMatch = input.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
      if (rgbMatch) { r = parseInt(rgbMatch[1]); g = parseInt(rgbMatch[2]); b = parseInt(rgbMatch[3]); }

      // R G B séparés
      const parts = input.split(/\s+/);
      if (parts.length === 3 && parts.every(p => /^\d+$/.test(p))) {
        r = parseInt(parts[0]); g = parseInt(parts[1]); b = parseInt(parts[2]);
      }

      if (r === undefined || [r, g, b].some(v => v < 0 || v > 255)) {
        throw new Error('Couleur non reconnue');
      }

      // Calculs
      const hex = `#${[r, g, b].map(v => v.toString(16).padStart(2, '0').toUpperCase()).join('')}`;
      const rN = r / 255, gN = g / 255, bN = b / 255;
      const max = Math.max(rN, gN, bN), min = Math.min(rN, gN, bN);
      const l   = (max + min) / 2;
      const s   = max === min ? 0 : l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
      let h = 0;
      if (max !== min) {
        if (max === rN) h = ((gN - bN) / (max - min) + 6) % 6;
        else if (max === gN) h = (bN - rN) / (max - min) + 2;
        else h = (rN - gN) / (max - min) + 4;
        h = Math.round(h * 60);
      }
      const luminance = (0.2126 * rN + 0.7152 * gN + 0.0722 * bN);
      const textColor = luminance > 0.5 ? 'sombre' : 'clair';

      await antiBan.safeSend(sock, jid, {
        text:
          `🎨 *COLOR CONVERT*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `HEX : \`${hex}\`\n` +
          `RGB : \`rgb(${r}, ${g}, ${b})\`\n` +
          `HSL : \`hsl(${h}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)\`\n` +
          `CSS Name: \`${hex.toLowerCase()}\`\n\n` +
          `Luminosité : ${Math.round(luminance * 100)}%\n` +
          `Texte sur fond : ${textColor}\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });

    } catch (e) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ Couleur invalide : \`${e.message}\`\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// .lorem — générateur de faux texte
// ─────────────────────────────────────────────────────────────────────────────
const LOREM_WORDS = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est'.split(' ');

const lorem = {
  name: 'lorem',
  execute: async (ctx) => {
    if (!guard(ctx)) return deny(ctx);
    const { sock, jid, msg, antiBan, args } = ctx;

    const sub   = (args[0] || '').toLowerCase();
    const count = Math.min(parseInt(args[1] || args[0]) || 50, 500);

    let result = '';

    if (sub === 'para' || sub === 'paragraphs') {
      const numPara = Math.min(parseInt(args[1]) || 2, 5);
      const paras   = Array.from({ length: numPara }, () => {
        const wc = Math.floor(Math.random() * 30) + 40;
        return Array.from({ length: wc }, () => LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]).join(' ') + '.';
      });
      result = paras.join('\n\n');
    } else {
      result = Array.from(
        { length: count },
        () => LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]
      ).join(' ');
    }

    // Capitaliser première lettre
    result = result.charAt(0).toUpperCase() + result.slice(1);

    await antiBan.safeSend(sock, jid, {
      text:
        `📄 *LOREM IPSUM (${count} mots)*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `${result}\n\n` +
        `💡 \`.lorem [n]\` · \`.lorem para [n]\`\n\n` + BOT_TAG,
    }, { msgOptions: { quoted: msg } });
  },
};

module.exports = { regex, jsonformat, diff, uuid, timestamp, ipcidr, coderun, colorcode, lorem };
