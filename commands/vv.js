/**
 * ZERO TRACE BOT v5.0 — .vv / .save
 * .vv   → renvoie le média "une vue" dans le chat
 * .save → envoie en DM à l'owner
 */
'use strict';

const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const zts = require('../lib/ztStyle');

const OWNER_JID = () => `${process.env.OWNER_NUMBER || '260956849240'}@s.whatsapp.net`;

// ── Détecter un média dans n'importe quelle structure de message ──────────────
function extractMedia(m) {
  if (!m) return null;

  // Toutes les enveloppes possibles
  const candidates = [
    m,
    m.message,
    m.viewOnceMessage?.message,
    m.viewOnceMessageV2?.message,
    m.viewOnceMessageV2Extension?.message,
    m.ephemeralMessage?.message,
    m.message?.viewOnceMessage?.message,
    m.message?.viewOnceMessageV2?.message,
    m.message?.viewOnceMessageV2Extension?.message,
    m.message?.imageMessage     ? m.message : null,
    m.message?.videoMessage     ? m.message : null,
  ].filter(Boolean);

  for (const c of candidates) {
    if (c.imageMessage) return { type: 'image', msg: c };
    if (c.videoMessage) return { type: 'video', msg: c };
  }
  return null;
}

// ── Construire un faux message Baileys pour downloadMediaMessage ──────────────
function buildFakeMsg(quotedMsg, quotedCtx, jid) {
  return {
    key: {
      remoteJid: quotedCtx?.participant || jid,
      id:        quotedCtx?.stanzaId    || '',
      fromMe:    false,
    },
    message: quotedMsg,
  };
}

module.exports = {
  name: 'vv',
  aliases: ['save', 'viewonce', 'vo'],
  description: 'Récupérer un média "une vue"',
  usage: '.vv (cite le message) | .save (envoie en DM owner)',
  category: 'media',

  async execute(ctx) {
    const { sock, jid, msg, command, antiBan } = ctx;
    const isSave = command === 'save';

    // ── Trouver le message cité ───────────────────────────────────────────────
    const ctxInfo  = msg.message?.extendedTextMessage?.contextInfo
                  || msg.message?.imageMessage?.contextInfo
                  || msg.message?.videoMessage?.contextInfo
                  || msg.message?.stickerMessage?.contextInfo;

    const quotedMsg = ctxInfo?.quotedMessage;

    if (!quotedMsg) {
      await antiBan.safeSend(sock, jid, {
        text:
          `💀 *PROTOCOLE VIEW-ONCE*\n` +
          `▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n` +
          `\`\`\`[ZT-OS] Mode: ${isSave ? 'SAVE → DM owner' : 'VV → Renvoyer ici'}\`\`\`\n\n` +
          `👉 Réponds à un message 🔒 *une vue* avec \`.${command}\`\n\n` +
          `> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── Détecter le type de média ─────────────────────────────────────────────
    const media = extractMedia(quotedMsg);

    if (!media) {
      await antiBan.safeSend(sock, jid, {
        text:
          `\`\`\`[ZT-OS] ERREUR: Aucun média détecté\n` +
          `Ce message ne contient pas de photo ou vidéo.\`\`\`\n\n` +
          `> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── Réaction chargement ───────────────────────────────────────────────────
    await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } }).catch(() => {});

    // ── Téléchargement ────────────────────────────────────────────────────────
    let buffer;
    try {
      const fakeMsg = buildFakeMsg(quotedMsg, ctxInfo, jid);

      // Tentative 1 : avec reuploadRequest
      try {
        buffer = await downloadMediaMessage(
          fakeMsg, 'buffer', {},
          { reuploadRequest: sock.updateMediaMessage }
        );
      } catch {
        // Tentative 2 : sans reuploadRequest
        buffer = await downloadMediaMessage(fakeMsg, 'buffer', {});
      }
    } catch (err) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, {
        text:
          `\`\`\`[ZT-OS] ERREUR téléchargement\n${err.message}\`\`\`\n\n` +
          `💡 _Le média est peut-être expiré._\n\n> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    if (!buffer || buffer.length === 0) {
      await antiBan.safeSend(sock, jid, {
        text: `\`\`\`[ZT-OS] ERREUR: Média vide ou expiré\`\`\`\n\n> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── Envoi ─────────────────────────────────────────────────────────────────
    const caption =
      `\`\`\`[ZT-OS] ${isSave ? 'Sauvegardé' : 'Média récupéré'}\n` +
      `Type   : ${media.type === 'image' ? 'IMAGE' : 'VIDEO'}\n` +
      `Status : SUCCESS ✓\`\`\`\n\n> ${zts.sig()}`;

    const destJid = isSave ? OWNER_JID() : jid;
    const sendOpts = isSave ? {} : { quoted: msg };

    try {
      if (media.type === 'image') {
        await sock.sendMessage(destJid, { image: buffer, caption, mimetype: 'image/jpeg' }, sendOpts);
      } else {
        await sock.sendMessage(destJid, { video: buffer, caption, mimetype: 'video/mp4' }, sendOpts);
      }
      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});

      if (isSave) {
        await antiBan.safeSend(sock, jid, {
          text:
            `\`\`\`[ZT-OS] Sauvegarde réussie\nDest   : DM Owner\nStatus : SENT ✓\`\`\`\n\n> ${zts.sig()}`,
        }, { msgOptions: { quoted: msg } });
      }
    } catch (err) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, {
        text:
          `\`\`\`[ZT-OS] ERREUR envoi\n${err.message}\`\`\`\n\n> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};
