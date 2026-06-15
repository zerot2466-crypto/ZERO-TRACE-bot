/**
 * ZERO TRACE BOT v5.0 — feedback.js
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Feedback utilisateurs + Notes personnelles owner
 *
 * COMMANDES TOUS USERS :
 *   .feedback [message]     — envoyer un feedback à l'owner
 *   .feedback list          — voir ses propres feedbacks envoyés
 *
 * COMMANDES OWNER/SUDO :
 *   .feedbacks              — voir tous les feedbacks reçus
 *   .feedbacks del [id]     — supprimer un feedback
 *   .feedbacks clear        — vider tous les feedbacks
 *   .myfeedback [texte]     — ajouter une note personnelle
 *   .myfeedback list        — lister ses notes
 *   .myfeedback del [id]    — supprimer une note
 */
'use strict';

const fs   = require('fs-extra');
const path = require('path');

const FEEDBACK_FILE = path.join(__dirname, '..', 'data', 'feedbacks.json');
const NOTES_FILE    = path.join(__dirname, '..', 'data', 'owner_notes.json');
const BOT_TAG       = '> ⚡ _ZERO TRACE BOT v5.0_';

function loadFeedbacks() {
  try { return fs.readJsonSync(FEEDBACK_FILE); } catch { return []; }
}
function saveFeedbacks(d) {
  fs.ensureDirSync(path.dirname(FEEDBACK_FILE));
  fs.writeJsonSync(FEEDBACK_FILE, d, { spaces: 2 });
}
function loadNotes() {
  try { return fs.readJsonSync(NOTES_FILE); } catch { return []; }
}
function saveNotes(d) {
  fs.ensureDirSync(path.dirname(NOTES_FILE));
  fs.writeJsonSync(NOTES_FILE, d, { spaces: 2 });
}
function genId() {
  return Date.now().toString(36).toUpperCase();
}
function formatDate(iso) {
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

// ─────────────────────────────────────────────────────────────────────────────
// .feedback — envoyer / lire les feedbacks
// ─────────────────────────────────────────────────────────────────────────────
const feedback = {
  name: 'feedback',
  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan, pushName, sender } = ctx;
    const sub = (args[0] || '').toLowerCase();

    // ── .feedback list → voir ses propres feedbacks envoyés ─────────────────
    if (sub === 'list') {
      const all  = loadFeedbacks();
      const mine = all.filter(f => f.sender === sender);
      if (!mine.length) {
        await antiBan.safeSend(sock, jid, {
          text: '📭 Tu n\'as encore envoyé aucun feedback.\n\nEnvoie : `.feedback [ton message]`\n\n' + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        return;
      }
      const lines = mine.slice(-5).map((f, i) =>
        `${i + 1}. [${f.id}] _${formatDate(f.at)}_\n   "${f.text.slice(0, 80)}"`
      ).join('\n\n');
      await antiBan.safeSend(sock, jid, {
        text: `📋 *TES FEEDBACKS (${mine.length})*\n\n${lines}\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .feedback [message] → envoyer un feedback ───────────────────────────
    const text = args.join(' ').trim();
    if (!text || text.length < 3) {
      await antiBan.safeSend(sock, jid, {
        text:
          '💬 *FEEDBACK*\n\n' +
          'Usage : `.feedback [ton message]`\n' +
          'Ex : `.feedback Le bot est super, mais .quiz bug parfois`\n\n' +
          'Tes retours sont lus par l\'owner.\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const all = loadFeedbacks();
    const entry = {
      id:       genId(),
      sender:   sender || 'unknown',
      name:     pushName || 'Inconnu',
      group:    jid.includes('@g.us') ? jid : null,
      text,
      at:       new Date().toISOString(),
      read:     false,
    };
    all.push(entry);
    saveFeedbacks(all);

    await antiBan.safeSend(sock, jid, {
      text:
        `✅ *Feedback envoyé !* [${entry.id}]\n\n` +
        `_"${text.slice(0, 100)}"_\n\n` +
        `Merci ${pushName} 🙏\n\n` + BOT_TAG,
    }, { msgOptions: { quoted: msg } });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// .feedbacks — gérer tous les feedbacks (owner/sudo)
// ─────────────────────────────────────────────────────────────────────────────
const feedbacks = {
  name: 'feedbacks',
  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan, isOwner, isSudo } = ctx;

    if (!isOwner && !isSudo) {
      await antiBan.safeSend(sock, jid, {
        text: '🔒 Commande réservée à l\'owner et aux sudos.\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const sub = (args[0] || '').toLowerCase();
    let all   = loadFeedbacks();

    // ── .feedbacks del [id] ──────────────────────────────────────────────────
    if (sub === 'del' || sub === 'delete') {
      const id = (args[1] || '').toUpperCase();
      const before = all.length;
      all = all.filter(f => f.id !== id);
      if (all.length === before) {
        await antiBan.safeSend(sock, jid, {
          text: `❌ Feedback [${id}] introuvable.\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        return;
      }
      saveFeedbacks(all);
      await antiBan.safeSend(sock, jid, {
        text: `🗑️ Feedback [${id}] supprimé.\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .feedbacks clear ─────────────────────────────────────────────────────
    if (sub === 'clear') {
      const count = all.length;
      saveFeedbacks([]);
      await antiBan.safeSend(sock, jid, {
        text: `🗑️ ${count} feedback(s) supprimé(s).\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .feedbacks → liste ───────────────────────────────────────────────────
    if (!all.length) {
      await antiBan.safeSend(sock, jid, {
        text: '📭 Aucun feedback reçu pour l\'instant.\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // Marquer tout comme lu
    all.forEach(f => f.read = true);
    saveFeedbacks(all);

    const unread = all.filter(f => !f.read).length;
    const recent = all.slice(-10).reverse();
    const lines  = recent.map((f, i) =>
      `${i + 1}. [${f.id}] *${f.name}* — _${formatDate(f.at)}_\n` +
      `   "${f.text.slice(0, 100)}${f.text.length > 100 ? '...' : ''}"`
    ).join('\n\n');

    await antiBan.safeSend(sock, jid, {
      text:
        `💬 *FEEDBACKS (${all.length} total)*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `${lines}\n\n` +
        `📌 Supprimer : \`.feedbacks del [ID]\`\n` +
        `📌 Tout vider : \`.feedbacks clear\`\n\n` + BOT_TAG,
    }, { msgOptions: { quoted: msg } });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// .myfeedback — notes personnelles owner (idées, todos, mémos)
// ─────────────────────────────────────────────────────────────────────────────
const myfeedback = {
  name: 'myfeedback',
  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan, isOwner, isSudo } = ctx;

    if (!isOwner && !isSudo) {
      await antiBan.safeSend(sock, jid, {
        text: '🔒 Commande réservée à l\'owner et aux sudos.\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const sub  = (args[0] || '').toLowerCase();
    let notes  = loadNotes();

    // ── list ─────────────────────────────────────────────────────────────────
    if (!sub || sub === 'list') {
      if (!notes.length) {
        await antiBan.safeSend(sock, jid, {
          text:
            '📓 *MES NOTES* — Aucune note.\n\n' +
            'Ajouter : `.myfeedback [texte]`\n' +
            'Ex : `.myfeedback Ajouter commande .apk`\n\n' + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        return;
      }
      const lines = notes.map((n, i) =>
        `${i + 1}. [${n.id}] _${formatDate(n.at)}_\n   📌 ${n.text}`
      ).join('\n\n');
      await antiBan.safeSend(sock, jid, {
        text:
          `📓 *MES NOTES (${notes.length})*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `${lines}\n\n` +
          `Supprimer : \`.myfeedback del [ID]\`\n` +
          `Tout vider : \`.myfeedback clear\`\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── del ──────────────────────────────────────────────────────────────────
    if (sub === 'del' || sub === 'delete') {
      const id = (args[1] || '').toUpperCase();
      const before = notes.length;
      notes = notes.filter(n => n.id !== id);
      if (notes.length === before) {
        await antiBan.safeSend(sock, jid, { text: `❌ Note [${id}] introuvable.\n\n` + BOT_TAG }, { msgOptions: { quoted: msg } });
        return;
      }
      saveNotes(notes);
      await antiBan.safeSend(sock, jid, { text: `🗑️ Note [${id}] supprimée.\n\n` + BOT_TAG }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── clear ────────────────────────────────────────────────────────────────
    if (sub === 'clear') {
      saveNotes([]);
      await antiBan.safeSend(sock, jid, { text: `🗑️ Toutes les notes supprimées.\n\n` + BOT_TAG }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── ajouter une note ─────────────────────────────────────────────────────
    const text = args.join(' ').trim();
    if (!text || text.length < 2) {
      await antiBan.safeSend(sock, jid, {
        text:
          '📓 *MES NOTES*\n\n' +
          'Usage :\n' +
          '`.myfeedback [texte]` — ajouter\n' +
          '`.myfeedback list` — voir toutes\n' +
          '`.myfeedback del [ID]` — supprimer\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const note = { id: genId(), text, at: new Date().toISOString() };
    notes.push(note);
    saveNotes(notes);

    await antiBan.safeSend(sock, jid, {
      text: `✅ Note [${note.id}] enregistrée.\n\n📌 _"${text.slice(0, 100)}"_\n\n` + BOT_TAG,
    }, { msgOptions: { quoted: msg } });
  },
};

module.exports = { feedback, feedbacks, myfeedback };
