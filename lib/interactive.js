/**
 * ZERO TRACE BOT v5.0 — lib/interactive.js
 * ══════════════════════════════════════════════════════════════════════════════
 * Équivalent Baileys de send_interactive_message()
 * Supporte : boutons · liste · réponse rapide · interactiveMessage (nativeFlow)
 *
 * Usage :
 *   const { sendInteractiveMessage, sendButtons, sendList, sendQuickReply }
 *     = require('./lib/interactive');
 *
 *   // Via ctx (dans une commande)
 *   await sendButtons(ctx.sock, ctx.jid, 'Choisissez :', [
 *     { id: 'btn_oui', label: '✅ Oui' },
 *     { id: 'btn_non', label: '❌ Non' },
 *   ]);
 *
 *   // Via payload unifié (équivalent Python)
 *   await sendInteractiveMessage(ctx.sock, ctx.jid, {
 *     type: 'list',
 *     text: 'Que voulez-vous faire ?',
 *     buttonText: 'Voir les options',
 *     sections: [{ title: 'Choix', rows: [{ id: 'a', label: 'Option A' }] }],
 *   });
 * ══════════════════════════════════════════════════════════════════════════════
 */

'use strict';

const fetch = (...args) =>
  import('node-fetch').then(({ default: f }) => f(...args)).catch(() => {
    // fallback si node-fetch non dispo
    return global.fetch ? global.fetch(...args) : Promise.reject(new Error('fetch non disponible'));
  });

// ── Normalise le JID ─────────────────────────────────────────────────────────
function normalizeJid(to) {
  if (!to) return to;
  if (to.includes('@')) return to;
  return `${to}@s.whatsapp.net`;
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. BOUTONS (max 3) — buttonMessage classique
// ══════════════════════════════════════════════════════════════════════════════
/**
 * @param {object} sock      Instance Baileys
 * @param {string} to        JID ou numéro brut
 * @param {string} text      Corps du message
 * @param {Array}  buttons   [{ id, label }, ...]  (max 3)
 * @param {string} [footer]  Texte footer optionnel
 * @param {object} [quoted]  Message à citer (msg Baileys)
 */
async function sendButtons(sock, to, text, buttons, footer = '', quoted = null) {
  const jid  = normalizeJid(to);
  const opts = quoted ? { quoted } : {};

  await sock.sendMessage(jid, {
    text,
    footer,
    buttons: buttons.slice(0, 3).map((b, i) => ({
      buttonId  : b.id    || `btn_${i}`,
      buttonText: { displayText: b.label || b.text || `Option ${i + 1}` },
      type      : 1,
    })),
    headerType: 1,
  }, opts);
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. LISTE (sections + rows) — listMessage
// ══════════════════════════════════════════════════════════════════════════════
/**
 * @param {object} sock        Instance Baileys
 * @param {string} to          JID ou numéro brut
 * @param {string} text        Corps du message
 * @param {string} buttonText  Libellé du bouton d'ouverture
 * @param {Array}  sections    [{ title, rows: [{ id, label, desc }] }]
 * @param {string} [title]     Titre du message (header)
 * @param {string} [footer]    Texte footer optionnel
 * @param {object} [quoted]    Message à citer
 */
async function sendList(sock, to, text, buttonText, sections, title = '', footer = '', quoted = null) {
  const jid  = normalizeJid(to);
  const opts = quoted ? { quoted } : {};

  await sock.sendMessage(jid, {
    text,
    title,
    footer,
    buttonText,
    sections: sections.map((s, si) => ({
      title: s.title || `Section ${si + 1}`,
      rows : (s.rows || s.items || []).map((r, ri) => ({
        rowId      : r.id          || `row_${si}_${ri}`,
        title      : r.label       || r.title       || `Ligne ${ri + 1}`,
        description: r.desc        || r.description || '',
      })),
    })),
    listType: 1,
  }, opts);
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. RÉPONSES RAPIDES — templateButtons
// ══════════════════════════════════════════════════════════════════════════════
/**
 * @param {object} sock       Instance Baileys
 * @param {string} to         JID ou numéro brut
 * @param {string} text       Corps du message
 * @param {Array}  replies    [{ id, label }, ...]
 * @param {string} [imageUrl] URL d'image optionnelle
 * @param {object} [quoted]   Message à citer
 */
async function sendQuickReply(sock, to, text, replies, imageUrl = null, quoted = null) {
  const jid  = normalizeJid(to);
  const opts = quoted ? { quoted } : {};

  const templateButtons = replies.map((r, i) => ({
    index          : i + 1,
    quickReplyButton: {
      displayText: r.label || r.text || `Option ${i + 1}`,
      id         : r.id    || `qr_${i}`,
    },
  }));

  if (imageUrl) {
    try {
      const res = await fetch(imageUrl);
      const buf = Buffer.from(await res.arrayBuffer());
      await sock.sendMessage(jid, { image: buf, caption: text, templateButtons }, opts);
      return;
    } catch (e) {
      console.warn('[interactive] Impossible de charger l\'image, fallback texte:', e.message);
    }
  }

  await sock.sendMessage(jid, { text, templateButtons }, opts);
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. NATIVE FLOW (interactiveMessage WA MD) — utilisé par le menu
// ══════════════════════════════════════════════════════════════════════════════
/**
 * Envoie un interactiveMessage avec nativeFlowMessage (single_select).
 * Utilisé pour le menu principal.
 *
 * @param {object} sock
 * @param {string} to
 * @param {string} bodyText       Corps du message
 * @param {string} buttonLabel    Libellé du bouton
 * @param {Array}  sections       [{ title, rows: [{ title, description, id }] }]
 * @param {string} [footerText]
 * @param {object} [quoted]
 */
async function sendNativeFlow(sock, to, bodyText, buttonLabel, sections, footerText = '', quoted = null) {
  const jid  = normalizeJid(to);
  const opts = quoted ? { quoted } : {};

  await sock.sendMessage(jid, {
    interactiveMessage: {
      header  : { hasMediaAttachment: false },
      body    : { text: bodyText },
      footer  : { text: footerText },
      nativeFlowMessage: {
        messageParamsJson: '',
        buttons: [{
          name            : 'single_select',
          buttonParamsJson: JSON.stringify({ title: buttonLabel, sections }),
        }],
      },
    },
  }, opts);
}

// ══════════════════════════════════════════════════════════════════════════════
// 5. FONCTION UNIFIÉE — équivalent exact du Python send_interactive_message()
// ══════════════════════════════════════════════════════════════════════════════
/**
 * Détecte automatiquement le type de message interactif à envoyer.
 *
 * payload.type peut être : 'button' | 'list' | 'quickreply' | 'nativeflow'
 *
 * Format button :
 *   { type:'button', text, footer, buttons:[{id,label}], action:{buttons} }
 *
 * Format list :
 *   { type:'list', text, buttonText, sections, title, footer,
 *     action:{ button, sections } }
 *
 * Format quickreply :
 *   { type:'quickreply', text, replies:[{id,label}], imageUrl }
 *
 * Format nativeflow :
 *   { type:'nativeflow', text, buttonLabel, sections, footer }
 *
 * @param {object} sock
 * @param {string} to
 * @param {object} payload
 * @param {object} [quoted]   Message à citer
 * @returns {{ success: boolean, error?: string }}
 */
async function sendInteractiveMessage(sock, to, payload, quoted = null) {
  const jid = normalizeJid(to);

  try {
    const type = payload.type || payload.action?.type;

    // ── Boutons ──────────────────────────────────────────────────────────────
    if (type === 'button' || (!type && payload.buttons)) {
      await sendButtons(
        sock,
        jid,
        payload.body?.text  || payload.text   || '',
        payload.action?.buttons || payload.buttons || [],
        payload.footer?.text    || payload.footer  || '',
        quoted,
      );

    // ── Liste ─────────────────────────────────────────────────────────────────
    } else if (type === 'list' || (!type && payload.sections)) {
      await sendList(
        sock,
        jid,
        payload.body?.text    || payload.text       || '',
        payload.action?.button || payload.buttonText || 'Voir options',
        payload.action?.sections || payload.sections || [],
        payload.header?.text     || payload.title    || '',
        payload.footer?.text     || payload.footer   || '',
        quoted,
      );

    // ── Réponses rapides ──────────────────────────────────────────────────────
    } else if (type === 'quickreply' || (!type && payload.replies)) {
      await sendQuickReply(
        sock,
        jid,
        payload.text || '',
        payload.replies || [],
        payload.imageUrl || null,
        quoted,
      );

    // ── NativeFlow (menu WA MD) ───────────────────────────────────────────────
    } else if (type === 'nativeflow') {
      await sendNativeFlow(
        sock,
        jid,
        payload.body?.text || payload.text        || '',
        payload.buttonLabel                        || 'Ouvrir',
        payload.sections                           || [],
        payload.footer?.text || payload.footer     || '',
        quoted,
      );

    // ── Fallback texte simple ─────────────────────────────────────────────────
    } else {
      const text = payload.body?.text || payload.text || '';
      await sock.sendMessage(jid, { text }, quoted ? { quoted } : {});
    }

    return { success: true };

  } catch (e) {
    console.error('[sendInteractive] Erreur:', e.message);
    return { success: false, error: e.message };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
module.exports = {
  sendInteractiveMessage,
  sendButtons,
  sendList,
  sendQuickReply,
  sendNativeFlow,
  normalizeJid,
};
