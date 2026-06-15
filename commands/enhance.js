/**
 * ZERO TRACE BOT v5.0 — .enhance v2
 * Améliorer une image : netteté, contraste, luminosité, saturation
 * ✅ downloadMediaMessage (Baileys stable)
 * ✅ Sharp multi-presets
 */
'use strict';
const zts = require('../lib/ztStyle');

const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp');

const BOT_TAG = '> *ZERO TRACE BOT v5.0*';

const PRESETS = {
  default: { sharpen: { sigma: 1.5 }, modulate: { brightness: 1.05, saturation: 1.2 }, label: 'Standard' },
  hd:      { sharpen: { sigma: 2.5 }, modulate: { brightness: 1.0,  saturation: 1.3 }, label: 'HD Sharp' },
  vivid:   { sharpen: { sigma: 1.0 }, modulate: { brightness: 1.1,  saturation: 1.8 }, label: 'Vivid' },
  bright:  { sharpen: { sigma: 1.0 }, modulate: { brightness: 1.3,  saturation: 1.1 }, label: 'Bright' },
  night:   { sharpen: { sigma: 2.0 }, modulate: { brightness: 1.4,  saturation: 1.0 }, label: 'Night Fix' },
};

async function getImageBuffer(sock, msg) {
  const { downloadMedia } = require('../lib/mediaHelper');
  return await downloadMedia(sock, msg, 'image');
}

module.exports = {
  name:    'enhance',
  aliases: ['ameliorer', 'hd', 'upscale'],
  usage:   '.enhance | .enhance hd | .enhance vivid (répondre à une image)',
  category: 'media',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan } = ctx;

    const imgBuf = await getImageBuffer(sock, msg);
    if (!imgBuf) {
      await antiBan.safeSend(sock, jid, {
        text:
          `❌ Réponds à une image avec *.enhance*\n\n` +
          `💡 *Presets disponibles :*\n` +
          `• *.enhance*         → Standard\n` +
          `• *.enhance hd*      → HD Sharp\n` +
          `• *.enhance vivid*   → Couleurs vives\n` +
          `• *.enhance bright*  → Plus lumineux\n` +
          `• *.enhance night*   → Photo de nuit\n\n${BOT_TAG}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const preset = PRESETS[args[0]?.toLowerCase()] || PRESETS.default;

    await sock.sendMessage(jid, { react: { text: '✨', key: msg.key } }).catch(() => {});
    await antiBan.safeSend(sock, jid, { text: `\`\`\`[ZT-IMG] Amélioration IA en cours...
Mode : ${preset.label}\`\`\`` }, { msgOptions: { quoted: msg } });

    try {
      const enhanced = await sharp(imgBuf)
        .sharpen(preset.sharpen)
        .modulate(preset.modulate)
        .jpeg({ quality: 95 })
        .toBuffer();

      await sock.sendMessage(jid, {
        image: enhanced,
        caption: `✅ *Image améliorée* — ${preset.label}\n\n${BOT_TAG}`,
      }, { quoted: msg });
      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});
    } catch (e) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, { text: `\`\`\`[ZT-IMG] ERREUR: ${e.message}\`\`\`

> ${zts.sig()}` }, { msgOptions: { quoted: msg } });
    }
  },
};
