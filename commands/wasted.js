/**
 * ZERO TRACE BOT v5.0 — .wasted v2
 * Effet WASTED GTA V sur une image
 * ✅ downloadMediaMessage (Baileys stable)
 * ✅ Sharp : desaturation + assombrissement + texte WASTED via SVG overlay
 */
'use strict';

const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp');

const BOT_TAG = '> *ZERO TRACE BOT v5.0*';

async function getImageBuffer(sock, msg) {
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (quoted?.imageMessage) {
    const stanzaId = msg.message?.extendedTextMessage?.contextInfo?.stanzaId;
    const fakeMsg = { key: { ...msg.key, id: stanzaId || '' }, message: quoted };
    return await downloadMediaMessage(fakeMsg, 'buffer', {}, {});
  }
  if (msg.message?.imageMessage) {
    return await downloadMediaMessage(msg, 'buffer', {}, {});
  }
  return null;
}

module.exports = {
  name:    'wasted',
  aliases: ['gtawasted', 'dead'],
  usage:   '.wasted (répondre à une image)',
  category: 'media',

  async execute(ctx) {
    const { sock, jid, msg, antiBan } = ctx;

    const imgBuf = await getImageBuffer(sock, msg);
    if (!imgBuf) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ Réponds à une image avec *.wasted*\n\n${BOT_TAG}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    await sock.sendMessage(jid, { react: { text: '💀', key: msg.key } }).catch(() => {});
    await antiBan.safeSend(sock, jid, { text: '💀 _Application de l\'effet WASTED..._' }, { msgOptions: { quoted: msg } });

    try {
      // Étape 1 : récupérer les dimensions
      const meta = await sharp(imgBuf).metadata();
      const w = meta.width  || 512;
      const h = meta.height || 512;

      // Étape 2 : effet BW + assombrissement
      const bwBuf = await sharp(imgBuf)
        .grayscale()
        .modulate({ brightness: 0.65 })
        .toBuffer();

      // Étape 3 : overlay SVG "WASTED" rouge centré
      const fontSize  = Math.round(w * 0.18);
      const strokeW   = Math.round(fontSize * 0.04);
      const yText     = Math.round(h * 0.58);

      const svgOverlay = Buffer.from(`
        <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
          <text
            x="${w / 2}" y="${yText}"
            font-family="Arial Black, Impact, sans-serif"
            font-size="${fontSize}"
            font-weight="900"
            text-anchor="middle"
            fill="#CC0000"
            stroke="#000000"
            stroke-width="${strokeW}"
            paint-order="stroke"
            letter-spacing="${Math.round(fontSize * 0.05)}"
          >WASTED</text>
          <line x1="${w * 0.05}" y1="${yText + fontSize * 0.15}" x2="${w * 0.95}" y2="${yText + fontSize * 0.15}"
            stroke="#CC0000" stroke-width="${Math.round(strokeW * 0.6)}" opacity="0.7"/>
        </svg>
      `);

      const result = await sharp(bwBuf)
        .composite([{ input: svgOverlay, blend: 'over' }])
        .jpeg({ quality: 90 })
        .toBuffer();

      await sock.sendMessage(jid, {
        image: result,
        caption: `💀 *WASTED*\n\n${BOT_TAG}`,
      }, { quoted: msg });
      await sock.sendMessage(jid, { react: { text: '💀', key: msg.key } }).catch(() => {});
    } catch (e) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, { text: `❌ Erreur wasted : ${e.message}\n\n${BOT_TAG}` }, { msgOptions: { quoted: msg } });
    }
  },
};
