/**
 * ZERO TRACE BOT v5.0 — activehours.js
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Horaires actifs — le bot répond uniquement dans un créneau horaire
 *
 * Commandes :
 *   .activehours                    — voir les horaires actuels
 *   .activehours set 08:00-22:00    — définir un créneau
 *   .activehours off                — désactiver (toujours actif)
 *   .activehours msg [texte]        — message en dehors des heures
 */
'use strict';

const fs   = require('fs-extra');
const path = require('path');

const HOURS_FILE = path.join(__dirname, '../data/active_hours.json');
const BOT_TAG    = '> ⚡ _ZERO TRACE BOT v5.0_';

function load() {
  try { return fs.readJsonSync(HOURS_FILE); }
  catch { return { enabled: false, start: '00:00', end: '23:59', offMsg: null }; }
}
function save(d) {
  fs.ensureDirSync(path.dirname(HOURS_FILE));
  fs.writeJsonSync(HOURS_FILE, d, { spaces: 2 });
}

// Vérifier si on est dans les horaires actifs
function isActiveNow() {
  const d = load();
  if (!d.enabled) return true; // désactivé = toujours actif

  const now   = new Date();
  const hhmm  = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = d.start.split(':').map(Number);
  const [eh, em] = d.end.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin   = eh * 60 + em;

  if (startMin <= endMin) {
    return hhmm >= startMin && hhmm <= endMin;
  } else {
    // Créneau qui passe minuit (ex: 22:00-06:00)
    return hhmm >= startMin || hhmm <= endMin;
  }
}

function getOffMessage() {
  const d = load();
  if (d.offMsg) return d.offMsg;
  const { start, end } = d;
  return `⏰ Le bot est inactif pour le moment.\nHoraires actifs : *${start} — ${end}*`;
}

module.exports = {
  name:    'activehours',
  aliases: ['horaires', 'schedule', 'botschedule'],
  isActiveNow,
  getOffMessage,

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

    // ── .activehours off ──────────────────────────────────────────────────────
    if (sub === 'off' || sub === 'disable') {
      d.enabled = false;
      save(d);
      await antiBan.safeSend(sock, jid, {
        text: '✅ Horaires désactivés — bot actif 24h/24.\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .activehours msg [texte] ──────────────────────────────────────────────
    if (sub === 'msg' || sub === 'message') {
      const txt = args.slice(1).join(' ').trim();
      if (!txt) {
        await antiBan.safeSend(sock, jid, {
          text: '📝 Usage : `.activehours msg [message hors horaires]`\n\n' + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        return;
      }
      d.offMsg = txt;
      save(d);
      await antiBan.safeSend(sock, jid, {
        text: `✅ Message hors horaires défini :\n_"${txt}"_\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .activehours set HH:MM-HH:MM ─────────────────────────────────────────
    if (sub === 'set') {
      const range = args[1] || '';
      const match = range.match(/^(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/);
      if (!match) {
        await antiBan.safeSend(sock, jid, {
          text:
            '⏰ Usage : `.activehours set HH:MM-HH:MM`\n' +
            'Ex : `.activehours set 08:00-22:00`\n' +
            'Ex : `.activehours set 22:00-06:00` (passe minuit)\n\n' + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        return;
      }
      d.enabled = true;
      d.start   = match[1];
      d.end     = match[2];
      save(d);

      const activeNow = isActiveNow();
      await antiBan.safeSend(sock, jid, {
        text:
          `✅ *Horaires définis : ${d.start} — ${d.end}*\n\n` +
          `Statut actuel : ${activeNow ? '🟢 Dans les horaires' : '🔴 Hors horaires'}\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .activehours — voir l'état ────────────────────────────────────────────
    const activeNow = isActiveNow();
    await antiBan.safeSend(sock, jid, {
      text:
        `⏰ *HORAIRES ACTIFS*\n━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `État    : ${d.enabled ? '🟢 Activés' : '⚪ Désactivés (24h/24)'}\n` +
        (d.enabled
          ? `Créneau : *${d.start} — ${d.end}*\n` +
            `Actuel  : ${activeNow ? '✅ Dans les horaires' : '⏸️ Hors horaires'}\n`
          : '') +
        `\n💡 Commandes :\n` +
        `\`.activehours set 08:00-22:00\`\n` +
        `\`.activehours off\`\n` +
        `\`.activehours msg [texte]\`\n\n` + BOT_TAG,
    }, { msgOptions: { quoted: msg } });
  },
};
