/**
 * ZERO TRACE BOT v5.0 — autoreply.js
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Réponses automatiques déclenchées par mots-clés
 *
 * Commandes :
 *   .autoreply add [mot] | [réponse]   — ajouter un trigger
 *   .autoreply del [mot]               — supprimer un trigger
 *   .autoreply list                    — voir tous les triggers
 *   .autoreply on/off                  — activer/désactiver pour ce groupe
 *   .autoreply exact on/off            — correspondance exacte ou partielle
 */
'use strict';

const fs   = require('fs-extra');
const path = require('path');

const REPLY_FILE = path.join(__dirname, '../data/autoreply.json');
const BOT_TAG    = '> ⚡ _ZERO TRACE BOT v5.0_';

function load() {
  try { return fs.readJsonSync(REPLY_FILE); }
  catch { return { enabled: {}, replies: [], exactMode: false }; }
}
function save(d) {
  fs.ensureDirSync(path.dirname(REPLY_FILE));
  fs.writeJsonSync(REPLY_FILE, d, { spaces: 2 });
}

// Vérifier si autoreply est actif dans un JID
function isEnabled(jid) {
  const d = load();
  return d.enabled?.[jid] !== false; // actif par défaut
}

// Chercher une réponse pour un message
function findReply(text, jid) {
  const d = load();
  if (!isEnabled(jid)) return null;
  const lower = text.toLowerCase().trim();
  for (const r of (d.replies || [])) {
    const trigger = r.trigger.toLowerCase();
    const match   = d.exactMode
      ? lower === trigger
      : lower.includes(trigger);
    if (match) return r.response;
  }
  return null;
}

module.exports = {
  name:    'autoreply',
  aliases: ['ar', 'autoreponse'],
  isEnabled,
  findReply,

  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan, isOwner, isSudo } = ctx;

    if (!isOwner && !isSudo) {
      await antiBan.safeSend(sock, jid, {
        text: '🔒 Réservé owner/sudo.\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const sub = (args[0] || '').toLowerCase();
    const d   = load();

    // ── on/off ────────────────────────────────────────────────────────────────
    if (sub === 'on' || sub === 'off') {
      if (!d.enabled) d.enabled = {};
      d.enabled[jid] = sub === 'on';
      save(d);
      await antiBan.safeSend(sock, jid, {
        text: `${sub === 'on' ? '✅' : '🔴'} Autoreply *${sub === 'on' ? 'activé' : 'désactivé'}* dans cette conversation.\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── exact on/off ──────────────────────────────────────────────────────────
    if (sub === 'exact') {
      const val = (args[1] || '').toLowerCase() === 'on';
      d.exactMode = val;
      save(d);
      await antiBan.safeSend(sock, jid, {
        text: `✅ Mode *${val ? 'exact' : 'partiel'}* activé.\n_${val ? 'Le message doit correspondre exactement au trigger.' : 'Le trigger peut être n\'importe où dans le message.'}_\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── list ──────────────────────────────────────────────────────────────────
    if (sub === 'list') {
      const replies = d.replies || [];
      if (!replies.length) {
        await antiBan.safeSend(sock, jid, {
          text: '📋 Aucun autoreply.\n\n`.autoreply add [mot] | [réponse]`\n\n' + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        return;
      }
      const lines = replies.map((r, i) =>
        `${i+1}. *"${r.trigger}"* → _${r.response.slice(0, 50)}${r.response.length > 50 ? '...' : ''}_`
      ).join('\n');
      await antiBan.safeSend(sock, jid, {
        text:
          `📋 *AUTOREPLY (${replies.length})*\n` +
          `Mode : ${d.exactMode ? 'exact' : 'partiel'} | ${isEnabled(jid) ? '🟢 Actif' : '🔴 Inactif'}\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n${lines}\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── del ───────────────────────────────────────────────────────────────────
    if (sub === 'del' || sub === 'remove') {
      const trigger = args.slice(1).join(' ').toLowerCase().trim();
      const before  = (d.replies || []).length;
      d.replies = (d.replies || []).filter(r => r.trigger.toLowerCase() !== trigger);
      if (d.replies.length === before) {
        await antiBan.safeSend(sock, jid, {
          text: `❌ Trigger *"${trigger}"* introuvable.\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        return;
      }
      save(d);
      await antiBan.safeSend(sock, jid, {
        text: `🗑️ Trigger *"${trigger}"* supprimé.\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── add [mot] | [réponse] ─────────────────────────────────────────────────
    if (sub === 'add') {
      const full    = args.slice(1).join(' ');
      const sepIdx  = full.indexOf('|');
      if (sepIdx === -1) {
        await antiBan.safeSend(sock, jid, {
          text:
            '⚙️ *AUTOREPLY*\n\n' +
            '`.autoreply add [mot] | [réponse]`\n' +
            '`.autoreply del [mot]`\n' +
            '`.autoreply list`\n' +
            '`.autoreply on/off`\n' +
            '`.autoreply exact on/off`\n\n' +
            'Ex : `.autoreply add bonjour | Salut ! Comment ça va ?`\n\n' + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      const trigger  = full.slice(0, sepIdx).trim().toLowerCase();
      const response = full.slice(sepIdx + 1).trim();

      if (!trigger || !response) {
        await antiBan.safeSend(sock, jid, {
          text: '❌ Trigger ou réponse manquant.\n\nFormat : `.autoreply add [mot] | [réponse]`\n\n' + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      if (!d.replies) d.replies = [];
      const existing = d.replies.findIndex(r => r.trigger.toLowerCase() === trigger);
      if (existing > -1) {
        d.replies[existing].response = response;
      } else {
        d.replies.push({ trigger, response, createdAt: new Date().toISOString() });
      }
      save(d);

      await antiBan.safeSend(sock, jid, {
        text:
          `✅ Autoreply *"${trigger}"* ${existing > -1 ? 'mis à jour' : 'ajouté'} !\n\n` +
          `→ _${response.slice(0, 100)}_\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // Aide par défaut
    await antiBan.safeSend(sock, jid, {
      text:
        '⚙️ *AUTOREPLY*\n\n' +
        '`.autoreply add [mot] | [réponse]`\n' +
        '`.autoreply del [mot]`\n' +
        '`.autoreply list`\n' +
        '`.autoreply on/off`\n' +
        '`.autoreply exact on/off`\n\n' + BOT_TAG,
    }, { msgOptions: { quoted: msg } });
  },
};
