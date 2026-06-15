/**
 * ZERO TRACE BOT v5.0 — customcmd.js v3 (AMÉLIORÉ)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * COMMANDES :
 *   .addcmd [nom] [réponse]        — créer une commande texte
 *   .addcmd [nom] --image [url]    — commande qui envoie une image
 *   .addcmd [nom] --reply [texte]  — commande avec réponse citée obligatoire
 *   .delcmd [nom]                  — supprimer
 *   .editcmd [nom] [réponse]       — modifier la réponse
 *   .listcmd                       — liste toutes les commandes custom
 *   .listcmd [recherche]           — filtrer par nom
 *   .cmdinfo [nom]                 — détails complets d'une commande
 *
 * VARIABLES DYNAMIQUES :
 *   {sender}   → prénom de l'expéditeur
 *   {tag}      → mention @expéditeur
 *   {group}    → nom du groupe
 *   {date}     → date locale
 *   {heure}    → heure locale
 *   {bot}      → ZERO TRACE BOT v5.0
 *   {count}    → nombre d'utilisations de cette commande
 *   {random:A|B|C} → choisit aléatoirement parmi A, B ou C
 *   \n         → saut de ligne
 *
 * PROTECTION :
 *   - Impossible d'écraser les commandes système
 *   - Noms réservés bloqués
 *   - Limite 50 commandes custom max
 */
'use strict';

const fs   = require('fs-extra');
const path = require('path');
const zts  = require('../lib/ztStyle');

const CMDS_FILE   = path.join(__dirname, '../data/custom_cmds.json');
const MAX_CMDS    = 50;
const MAX_NAME    = 25;
const MAX_RESP    = 1000;

// Commandes système à protéger (ne peuvent pas être écrasées)
const SYSTEM_CMDS = new Set([
  'help','menu','ping','alive','info','ai','tts','play','song','sticker',
  'kick','promote','demote','mute','tagall','warn','ban','addcmd','delcmd',
  'editcmd','listcmd','mycmds','cmdinfo','owner','sudo','pair','zero','wake',
  'translate','nasa','imagine','img','draw','search','wiki','news','weather',
  'removebg','enhance','blur','vision','transcribe','vv','toimg','lyric',
  'setprefix','setimage','setwelcome','settings','config','restart','update',
]);

function load() {
  try { return fs.readJsonSync(CMDS_FILE); } catch { return {}; }
}
function save(d) {
  fs.ensureDirSync(path.dirname(CMDS_FILE));
  fs.writeJsonSync(CMDS_FILE, d, { spaces: 2 });
}

// ── Résolution des variables dynamiques ───────────────────────────────────────
async function resolveVars(template, { sock, jid, msg, sender, pushName, count = 0 }) {
  let text = template
    .replace(/\\n/g, '\n')
    .replace(/\{sender\}/gi,  pushName || 'Membre')
    .replace(/\{tag\}/gi,     `@${(sender || '').split('@')[0]}`)
    .replace(/\{date\}/gi,    new Date().toLocaleDateString('fr-FR'))
    .replace(/\{heure\}/gi,   new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
    .replace(/\{bot\}/gi,     'ZERO TRACE BOT v5.0')
    .replace(/\{count\}/gi,   String(count));

  // {group} → nom du groupe
  if (text.includes('{group}') && jid.endsWith('@g.us')) {
    try {
      const meta = await sock.groupMetadata(jid);
      text = text.replace(/\{group\}/gi, meta.subject || 'Groupe');
    } catch { text = text.replace(/\{group\}/gi, 'Groupe'); }
  } else {
    text = text.replace(/\{group\}/gi, 'Privé');
  }

  // {random:A|B|C} → choix aléatoire
  text = text.replace(/\{random:([^}]+)\}/gi, (_, opts) => {
    const choices = opts.split('|').map(s => s.trim()).filter(Boolean);
    return choices[Math.floor(Math.random() * choices.length)] || '';
  });

  return text;
}

// ── Exécuter une commande custom (appelé depuis handler.js) ───────────────────
async function execCustomCmd(sock, jid, msg, cmdName, antiBan) {
  const cmds  = load();
  const entry = cmds[cmdName.toLowerCase()];
  if (!entry) return false;

  const sender   = msg.key.participant || msg.key.remoteJid || '';
  const pushName = msg.pushName || 'Membre';

  // Incrémenter le compteur
  entry.usageCount = (entry.usageCount || 0) + 1;
  entry.lastUsed   = new Date().toISOString();
  save(cmds);

  // Résoudre les variables
  const text = await resolveVars(entry.response, { sock, jid, msg, sender, pushName, count: entry.usageCount });

  // ── Type de réponse ──────────────────────────────────────────────────────
  if (entry.type === 'image' && entry.imageUrl) {
    try {
      const axios = require('axios');
      const res   = await axios.get(entry.imageUrl, { responseType: 'arraybuffer', timeout: 20000 });
      await sock.sendMessage(jid, {
        image:   Buffer.from(res.data),
        caption: text || undefined,
      }, { quoted: msg });
      return true;
    } catch { /* fallback texte si image fail */ }
  }

  // Mentions si {tag} présent
  const mentions = entry.response.includes('{tag}') ? [sender] : [];

  await antiBan.safeSend(sock, jid, {
    text,
    mentions: mentions.length ? mentions : undefined,
  }, { msgOptions: { quoted: msg } });

  return true;
}

function getAll() { return load(); }

// ── Module principal ──────────────────────────────────────────────────────────
module.exports = {
  name:    'addcmd',
  aliases: ['delcmd', 'listcmd', 'editcmd', 'mycmds', 'cmdinfo'],
  execCustomCmd,
  getAll,

  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan, isOwner, isSudo, command, prefix, pushName } = ctx;

    if (!isOwner && !isSudo) {
      await antiBan.safeSend(sock, jid, {
        text: `🔒 Réservé owner/sudo.\n\n> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const cmds = load();

    // ════════════════════════════════════════════════════════════════════════
    // .listcmd [filtre?]
    // ════════════════════════════════════════════════════════════════════════
    if (command === 'listcmd' || command === 'mycmds') {
      const filter = args[0]?.toLowerCase() || '';
      let keys = Object.keys(cmds);
      if (filter) keys = keys.filter(k => k.includes(filter));

      if (!keys.length) {
        await antiBan.safeSend(sock, jid, {
          text:
            `📋 *Aucune commande custom${filter ? ` pour "${filter}"` : ''}.*\n\n` +
            `Crée-en une : \`${prefix}addcmd [nom] [réponse]\`\n\n> ${zts.sig()}`,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      const lines = keys.map((k, i) => {
        const e    = cmds[k];
        const icon = e.type === 'image' ? '🖼️' : '💬';
        const uses = e.usageCount ? ` _(×${e.usageCount})_` : '';
        const prev = e.response.replace(/\\n/g, ' ').slice(0, 50);
        return `${i + 1}. ${icon} *${prefix}${k}*${uses}\n   _${prev}${e.response.length > 50 ? '...' : ''}_`;
      }).join('\n\n');

      await antiBan.safeSend(sock, jid, {
        text:
          `📋 *COMMANDES CUSTOM (${keys.length}/${MAX_CMDS})*\n` +
          `▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n\n` +
          `${lines}\n\n` +
          `💡 \`${prefix}cmdinfo [nom]\` pour les détails\n\n> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ════════════════════════════════════════════════════════════════════════
    // .cmdinfo [nom]
    // ════════════════════════════════════════════════════════════════════════
    if (command === 'cmdinfo') {
      const name = (args[0] || '').toLowerCase().replace(/^\./, '');
      if (!name || !cmds[name]) {
        await antiBan.safeSend(sock, jid, {
          text: `❓ Commande *${prefix}${name || '?'}* introuvable.\n\nTape \`${prefix}listcmd\` pour voir toutes les commandes.\n\n> ${zts.sig()}`,
        }, { msgOptions: { quoted: msg } });
        return;
      }
      const e = cmds[name];
      const created = e.createdAt ? new Date(e.createdAt).toLocaleDateString('fr-FR') : 'N/A';
      const updated = e.updatedAt ? new Date(e.updatedAt).toLocaleDateString('fr-FR') : 'jamais';
      const last    = e.lastUsed  ? new Date(e.lastUsed).toLocaleDateString('fr-FR')  : 'jamais';
      await antiBan.safeSend(sock, jid, {
        text:
          `📊 *INFOS — ${prefix}${name}*\n` +
          `▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n\n` +
          `📌 Nom : *${prefix}${name}*\n` +
          `🏷️ Type : ${e.type === 'image' ? '🖼️ Image' : '💬 Texte'}\n` +
          `📈 Utilisations : *${e.usageCount || 0}×*\n` +
          `📅 Créée le : ${created}\n` +
          `✏️ Modifiée le : ${updated}\n` +
          `🕐 Dernier usage : ${last}\n\n` +
          `💬 *Réponse :*\n${e.response.replace(/\\n/g, '\n')}\n\n` +
          (e.imageUrl ? `🖼️ URL image : ${e.imageUrl}\n\n` : '') +
          `> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ════════════════════════════════════════════════════════════════════════
    // .delcmd [nom]
    // ════════════════════════════════════════════════════════════════════════
    if (command === 'delcmd') {
      const name = (args[0] || '').toLowerCase().replace(/^\./, '');
      if (!name) {
        await antiBan.safeSend(sock, jid, {
          text: `🗑️ Usage : \`${prefix}delcmd [nom]\`\n\n> ${zts.sig()}`,
        }, { msgOptions: { quoted: msg } });
        return;
      }
      if (!cmds[name]) {
        await antiBan.safeSend(sock, jid, {
          text: `❌ *${prefix}${name}* introuvable.\n\n\`${prefix}listcmd\` pour voir toutes les commandes.\n\n> ${zts.sig()}`,
        }, { msgOptions: { quoted: msg } });
        return;
      }
      const uses = cmds[name].usageCount || 0;
      delete cmds[name];
      save(cmds);
      await antiBan.safeSend(sock, jid, {
        text:
          `\`\`\`[ZT-CMD] Commande supprimée\nNom    : ${prefix}${name}\nUsages : ${uses}×\`\`\`\n\n> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ════════════════════════════════════════════════════════════════════════
    // .editcmd [nom] [nouvelle réponse]
    // ════════════════════════════════════════════════════════════════════════
    if (command === 'editcmd') {
      const name     = (args[0] || '').toLowerCase().replace(/^\./, '');
      const response = args.slice(1).join(' ').trim();
      if (!name || !response) {
        await antiBan.safeSend(sock, jid, {
          text:
            `✏️ *Usage :* \`${prefix}editcmd [nom] [nouvelle réponse]\`\n\n` +
            `Variables : \`{sender}\` \`{tag}\` \`{date}\` \`{heure}\` \`{group}\` \`{count}\` \`{random:A|B|C}\`\n\n` +
            `> ${zts.sig()}`,
        }, { msgOptions: { quoted: msg } });
        return;
      }
      if (!cmds[name]) {
        await antiBan.safeSend(sock, jid, {
          text: `❌ *${prefix}${name}* inexistante. Utilise \`${prefix}addcmd\`.\n\n> ${zts.sig()}`,
        }, { msgOptions: { quoted: msg } });
        return;
      }
      if (response.length > MAX_RESP) {
        await antiBan.safeSend(sock, jid, {
          text: `❌ Réponse trop longue (${response.length}/${MAX_RESP} chars max).\n\n> ${zts.sig()}`,
        }, { msgOptions: { quoted: msg } });
        return;
      }
      cmds[name].response  = response;
      cmds[name].updatedAt = new Date().toISOString();
      save(cmds);
      // Preview
      const preview = await resolveVars(response, { sock, jid, msg, sender: ctx.sender, pushName, count: cmds[name].usageCount || 0 });
      await antiBan.safeSend(sock, jid, {
        text:
          `\`\`\`[ZT-CMD] Commande mise à jour\nNom : ${prefix}${name}\`\`\`\n\n` +
          `👁️ *Aperçu :*\n${preview.slice(0, 300)}\n\n> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ════════════════════════════════════════════════════════════════════════
    // .addcmd [nom] [réponse | --image URL]
    // ════════════════════════════════════════════════════════════════════════

    // Aide si aucun argument
    if (!args.length) {
      await antiBan.safeSend(sock, jid, {
        text:
          `⚙️ *COMMANDES CUSTOM — GUIDE*\n` +
          `▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n\n` +
          `*Créer une commande texte :*\n` +
          `\`${prefix}addcmd [nom] [texte]\`\n\n` +
          `*Créer une commande image :*\n` +
          `\`${prefix}addcmd [nom] --image [url] [légende?]\`\n\n` +
          `*Autres commandes :*\n` +
          `• \`${prefix}delcmd [nom]\` — supprimer\n` +
          `• \`${prefix}editcmd [nom] [texte]\` — modifier\n` +
          `• \`${prefix}listcmd\` — voir toutes\n` +
          `• \`${prefix}cmdinfo [nom]\` — détails\n\n` +
          `*Variables dynamiques :*\n` +
          `\`{sender}\` → prénom | \`{tag}\` → @mention\n` +
          `\`{group}\` → nom groupe | \`{date}\` → date\n` +
          `\`{heure}\` → heure | \`{count}\` → nb utilisations\n` +
          `\`{random:A|B|C}\` → réponse aléatoire\n` +
          `\`\\n\` → saut de ligne\n\n` +
          `*Exemples :*\n` +
          `• \`${prefix}addcmd bonjour Salut {sender} ! 👋\\nBienvenue sur {group}\`\n` +
          `• \`${prefix}addcmd dé {random:1|2|3|4|5|6}\`\n` +
          `• \`${prefix}addcmd logo --image https://i.imgur.com/xxx.jpg Logo ZT\`\n\n` +
          `📊 Commandes créées : *${Object.keys(cmds).length}/${MAX_CMDS}*\n\n` +
          `> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const name = (args[0] || '').toLowerCase().replace(/^\./, '').trim();

    // ── Validations du nom ────────────────────────────────────────────────────
    if (!name) {
      await antiBan.safeSend(sock, jid, { text: `❌ Nom invalide.\n\n> ${zts.sig()}` }, { msgOptions: { quoted: msg } });
      return;
    }
    if (name.length > MAX_NAME) {
      await antiBan.safeSend(sock, jid, { text: `❌ Nom trop long (${name.length}/${MAX_NAME} chars max).\n\n> ${zts.sig()}` }, { msgOptions: { quoted: msg } });
      return;
    }
    if (!/^[a-z0-9_-]+$/i.test(name)) {
      await antiBan.safeSend(sock, jid, { text: `❌ Nom invalide. Lettres, chiffres, \`-\` et \`_\` uniquement.\n\n> ${zts.sig()}` }, { msgOptions: { quoted: msg } });
      return;
    }
    if (SYSTEM_CMDS.has(name)) {
      await antiBan.safeSend(sock, jid, { text: `⛔ *${prefix}${name}* est une commande système protégée.\n\nChoisis un autre nom.\n\n> ${zts.sig()}` }, { msgOptions: { quoted: msg } });
      return;
    }
    if (!cmds[name] && Object.keys(cmds).length >= MAX_CMDS) {
      await antiBan.safeSend(sock, jid, { text: `❌ Limite atteinte (${MAX_CMDS} commandes max). Supprime-en une avec \`${prefix}delcmd\`.\n\n> ${zts.sig()}` }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── Détecter le type ──────────────────────────────────────────────────────
    const rest       = args.slice(1);
    const imageFlag  = rest.indexOf('--image');
    let type         = 'text';
    let imageUrl     = null;
    let response     = '';

    if (imageFlag !== -1) {
      // .addcmd nom --image URL [légende optionnelle]
      type     = 'image';
      imageUrl = rest[imageFlag + 1] || '';
      const legendeParts = [...rest.slice(0, imageFlag), ...rest.slice(imageFlag + 2)];
      response = legendeParts.join(' ').trim();

      if (!imageUrl || !imageUrl.startsWith('http')) {
        await antiBan.safeSend(sock, jid, {
          text: `❌ URL image invalide.\n\nUsage : \`${prefix}addcmd [nom] --image [url] [légende]\`\n\n> ${zts.sig()}`,
        }, { msgOptions: { quoted: msg } });
        return;
      }
      if (!response) response = `🖼️ *${name}*`;
    } else {
      response = rest.join(' ').trim();
    }

    if (!response && type !== 'image') {
      await antiBan.safeSend(sock, jid, {
        text: `❌ La réponse ne peut pas être vide.\n\n> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }
    if (response.length > MAX_RESP) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ Réponse trop longue (${response.length}/${MAX_RESP} chars max).\n\n> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const existed = !!cmds[name];
    cmds[name] = {
      response,
      type,
      ...(imageUrl ? { imageUrl } : {}),
      createdAt:  existed ? cmds[name].createdAt : new Date().toISOString(),
      updatedAt:  existed ? new Date().toISOString() : undefined,
      usageCount: existed ? (cmds[name].usageCount || 0) : 0,
      createdBy:  pushName || 'owner',
    };
    if (!cmds[name].updatedAt) delete cmds[name].updatedAt;
    save(cmds);

    // Aperçu de la réponse résolue
    const preview = type === 'image'
      ? `🖼️ _Enverra une image_\n${imageUrl}\n\n📝 Légende : ${response || '_(aucune)_'}`
      : await resolveVars(response, { sock, jid, msg, sender: ctx.sender, pushName, count: 0 });

    await antiBan.safeSend(sock, jid, {
      text:
        `\`\`\`[ZT-CMD] Commande ${existed ? 'mise à jour' : 'créée'}\n` +
        `Nom  : ${prefix}${name}\n` +
        `Type : ${type === 'image' ? 'Image 🖼️' : 'Texte 💬'}\`\`\`\n\n` +
        `👁️ *Aperçu :*\n${preview.slice(0, 400)}\n\n` +
        `✅ Teste avec \`${prefix}${name}\`\n\n` +
        `> ${zts.sig()}`,
    }, { msgOptions: { quoted: msg } });
  },
};
