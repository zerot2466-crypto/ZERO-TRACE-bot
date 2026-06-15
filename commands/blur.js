/**
 * ZERO TRACE BOT v5.0 — .blur v2
 * Flouter une image — niveaux : léger / moyen / fort
 * ✅ downloadMediaMessage (Baileys stable)
 * ✅ Sharp avec 3 niveaux de flou
 */
'use strict';
const zts = require('../lib/ztStyle');

const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp');

const LEVELS = { leger: 5, moyen: 15, fort: 30, light: 5, medium: 15, heavy: 30 };
const BOT_TAG = '> *ZERO TRACE BOT v5.0*';

async function getImageBuffer(sock, msg) {
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const imgMsg = quoted?.imageMessage || msg.message?.imageMessage;
  if (!imgMsg) return null;

  if (quoted?.imageMessage) {
    const stanzaId = msg.message?.extendedTextMessage?.contextInfo?.stanzaId;
    const fakeMsg = { key: { ...msg.key, id: stanzaId || '' }, message: quoted };
    const { downloadMedia } = require('../lib/mediaHelper');
    return await downloadMedia(sock, { key: { ...msg.key, id: stanzaId || '' }, message: quoted }, 'image');
  }
  const { downloadMedia } = require('../lib/mediaHelper');
  return await downloadMedia(sock, msg, 'image');
}

module.exports = {
  name:    'blur',
  aliases: ['flouter', 'flou'],
  usage:   '.blur | .blur fort (répondre à une image)',
  category: 'media',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan } = ctx;

    const imgBuf = await getImageBuffer(sock, msg);
    if (!imgBuf) {
      await antiBan.safeSend(sock, jid, {
        text: `\`\`\`[ZT-IMG] ERREUR: Aucune image détectée
Usage  : Réponds à une image avec .blur
Niveau : .blur leger | .blur moyen | .blur fort\`\`\`

> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const level = LEVELS[args[0]?.toLowerCase()] ?? 15;
    const labelMap = { 5: 'léger', 15: 'moyen', 30: 'fort' };

    await sock.sendMessage(jid, { react: { text: '🎨', key: msg.key } }).catch(() => {});
    await antiBan.safeSend(sock, jid, { text: `🎨 _Flou ${labelMap[level] || 'moyen'} en cours..._` }, { msgOptions: { quoted: msg } });

    try {
      const blurred = await sharp(imgBuf).blur(level).jpeg({ quality: 90 }).toBuffer();
      await sock.sendMessage(jid, {
        image: blurred,
        caption: `✅ *Image floutée* (${labelMap[level] || 'moyen'})\n\n${BOT_TAG}`,
      }, { quoted: msg });
      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});
    } catch (e) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, { text: `❌ Erreur blur : ${e.message}\n\n${BOT_TAG}` }, { msgOptions: { quoted: msg } });
    }
  },
};
