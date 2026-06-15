/**
 * ZERO TRACE BOT v5.0 — mediaHelper.js
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Fonctions utilitaires pour télécharger les médias WhatsApp
 * avec double fallback (reuploadRequest → sans → axios direct)
 */
'use strict';

const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');

/**
 * Télécharger un média WhatsApp (image, audio, vidéo, sticker)
 * Triple fallback :
 *   1. downloadMediaMessage avec reuploadRequest
 *   2. downloadMediaMessage sans reuploadRequest
 *   3. Téléchargement direct via URL si disponible dans le message
 *
 * @param {object} sock - socket Baileys
 * @param {object} msg  - message WhatsApp (direct ou quoted)
 * @param {string} type - 'image' | 'audio' | 'video' | 'sticker' | 'document'
 * @returns {Buffer|null}
 */
async function downloadMedia(sock, msg, type = 'image') {
  // Résoudre le bon message (direct ou quoted)
  const m       = msg.message || {};
  const quoted  = m.extendedTextMessage?.contextInfo?.quotedMessage;
  const typeKey = `${type}Message`;

  let targetMsg = null;

  if (m[typeKey]) {
    // Message direct
    targetMsg = msg;
  } else if (quoted?.[typeKey]) {
    // Message cité
    const stanzaId = m.extendedTextMessage?.contextInfo?.stanzaId;
    targetMsg = {
      key:     { remoteJid: msg.key.remoteJid, id: stanzaId || '', fromMe: false },
      message: quoted,
    };
  }

  if (!targetMsg) return null;

  // ── Essai 1 : avec reuploadRequest ───────────────────────────────────────
  try {
    const buf = await downloadMediaMessage(
      targetMsg, 'buffer', {},
      { reuploadRequest: sock.updateMediaMessage }
    );
    if (buf && buf.length > 200) return buf;
  } catch (e1) {
    console.log(`[MEDIA] Essai 1 échoué (${type}):`, e1.message);
  }

  // ── Essai 2 : sans reuploadRequest ───────────────────────────────────────
  try {
    const buf = await downloadMediaMessage(targetMsg, 'buffer', {});
    if (buf && buf.length > 200) return buf;
  } catch (e2) {
    console.log(`[MEDIA] Essai 2 échoué (${type}):`, e2.message);
  }

  // ── Essai 3 : URL directe depuis le message ───────────────────────────────
  try {
    const mediaMsg = (targetMsg.message || {})[typeKey];
    const directUrl = mediaMsg?.url || mediaMsg?.directPath;
    if (directUrl && directUrl.startsWith('http')) {
      const res = await axios.get(directUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: { 'User-Agent': 'WhatsApp/2.24.8.78 A' },
      });
      const buf = Buffer.from(res.data);
      if (buf && buf.length > 200) return buf;
    }
  } catch (e3) {
    console.log(`[MEDIA] Essai 3 échoué (${type}):`, e3.message);
  }

  return null;
}

module.exports = { downloadMedia };
