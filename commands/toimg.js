/**
 * ZERO TRACE BOT v5.0 — .toimg v2
 * Convertir un sticker WebP en image PNG/JPEG
 * ✅ downloadMediaMessage (Baileys stable)
 * ✅ Sharp pour conversion WebP → JPEG propre
 */
'use strict';

const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp');

const BOT_TAG = '> *ZERO TRACE BOT v5.0*';

module.exports = {
  name:    'toimg',
  aliases: ['stickertoimg', 'webptoimg', 'stk2img'],
  usage:   '.toimg (répondre à un sticker)',
  category: 'media',

  async execute(ctx) {
    const { sock, jid, msg, antiBan } = ctx;

    const quoted   = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const stickMsg = quoted?.stickerMessage || msg.message?.stickerMessage;

    if (!stickMsg) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ Réponds à un *sticker* avec *.toimg* pour le convertir en image.\n\n${BOT_TAG}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    await sock.sendMessage(jid, { react: { text: '🖼️', key: msg.key } }).catch(() => {});

    try {
      let buffer;

      if (quoted?.stickerMessage) {
        const stanzaId = msg.message?.extendedTextMessage?.contextInfo?.stanzaId;
        const fakeMsg  = { key: { ...msg.key, id: stanzaId || '' }, message: quoted };
        buffer = await downloadMediaMessage(fakeMsg, 'buffer', {}, {});
      } else {
        buffer = await downloadMediaMessage(msg, 'buffer', {}, {});
      }

      if (!buffer || buffer.length < 100) throw new Error('Sticker vide ou illisible');

      // Convertir WebP → JPEG via sharp (gère aussi les WebP animés → première frame)
      const jpegBuf = await sharp(buffer, { pages: 1 })
        .flatten({ background: { r: 255, g: 255, b: 255 } }) // fond blanc si transparent
        .jpeg({ quality: 95 })
        .toBuffer();

      await sock.sendMessage(jid, {
        image: jpegBuf,
        caption: `✅ *Sticker → Image*\n\n${BOT_TAG}`,
        mimetype: 'image/jpeg',
      }, { quoted: msg });
      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});

    } catch (e) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, {
        text: `❌ Erreur conversion : ${e.message}\n\n${BOT_TAG}`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};
