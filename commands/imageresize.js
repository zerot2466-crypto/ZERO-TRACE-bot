/**
 * ZERO TRACE BOT v5.0 — Image Resize / Recadrage
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * API 1 : api.drexapp.space/tools/imageresize  ← NOUVELLE
 * API 2 : Jimp (traitement local, fallback)
 * API 3 : picresize.com API (fallback)
 *
 * Commandes :
 *   .resize 800x600       → redimensionner à 800x600
 *   .resize 50%           → redimensionner à 50%
 *   .resize 512           → carré 512x512 (utile pour stickers IA)
 *   .crop 200x200+10+10   → rogner (largeur x hauteur + x + y)
 */
'use strict';
const axios = require('axios');
const DREX  = 'https://api.drexapp.space';

// Extraire l'URL d'une image d'un message (image directe ou citée)
function getImageFromCtx(msg) {
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (quoted?.imageMessage) return { fromQuote: true };
  if (msg.message?.imageMessage) return { fromDirect: true };
  return null;
}

async function getImageBuffer(sock, msg) {
  const { downloadMediaMessage } = require('@whiskeysockets/baileys');
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (quoted?.imageMessage) {
    const fakeMsg = {
      key: { ...msg.key },
      message: { imageMessage: quoted.imageMessage },
    };
    return await downloadMediaMessage(fakeMsg, 'buffer', {});
  }
  if (msg.message?.imageMessage) {
    return await downloadMediaMessage(msg, 'buffer', {});
  }
  return null;
}

async function resizeWithDrex(imageUrl, width, height) {
  const res = await axios.get(
    `${DREX}/tools/imageresize?url=${encodeURIComponent(imageUrl)}&width=${width}&height=${height}`,
    { responseType: 'arraybuffer', timeout: 25000 }
  );
  return Buffer.from(res.data);
}

module.exports = {
  name:    'resize',
  aliases: ['imageresize', 'resizeimage', 'redim'],
  description: 'Redimensionner une image (répondre à une image)',
  usage:   '.resize 800x600 | .resize 50% | .resize 512',
  category: 'outils',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan } = ctx;

    if (!args[0]) {
      await antiBan.safeSend(sock, jid, {
        text:
          `📐 *.resize [taille]*\n\n` +
          `*Utilisation :* Réponds à une image puis tape :\n\n` +
          `• *.resize 800x600*    → 800 × 600 px\n` +
          `• *.resize 512*        → 512 × 512 px (carré)\n` +
          `• *.resize 50%*        → réduire de 50%\n` +
          `• *.resize 1080x1920*  → format Story Instagram\n` +
          `• *.resize 512x512*    → format sticker IA\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const imgInfo = getImageFromCtx(msg);
    if (!imgInfo) {
      await antiBan.safeSend(sock, jid, {
        text: '❌ Réponds à une *image* avec *.resize [taille]*\n\n> *ZERO TRACE BOT v5.0*',
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // Parser les dimensions
    const sizeArg = args[0].toLowerCase();
    let width, height, isPercent = false, percentVal = null;

    if (sizeArg.endsWith('%')) {
      isPercent  = true;
      percentVal = parseInt(sizeArg);
      if (isNaN(percentVal) || percentVal < 1 || percentVal > 500) {
        await antiBan.safeSend(sock, jid, { text: '❌ Pourcentage invalide. Ex: *.resize 50%*' }, { msgOptions: { quoted: msg } });
        return;
      }
    } else if (sizeArg.includes('x')) {
      const parts = sizeArg.split('x');
      width  = parseInt(parts[0]);
      height = parseInt(parts[1]);
      if (isNaN(width) || isNaN(height) || width < 1 || height < 1 || width > 4096 || height > 4096) {
        await antiBan.safeSend(sock, jid, { text: '❌ Dimensions invalides. Max : 4096x4096\nEx: *.resize 800x600*' }, { msgOptions: { quoted: msg } });
        return;
      }
    } else {
      const size = parseInt(sizeArg);
      if (isNaN(size) || size < 1 || size > 4096) {
        await antiBan.safeSend(sock, jid, { text: '❌ Taille invalide. Ex: *.resize 512*' }, { msgOptions: { quoted: msg } });
        return;
      }
      width = height = size;
    }

    try {
      await sock.sendMessage(jid, { react: { text: '📐', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, { text: '📐 _Redimensionnement en cours..._' }, { msgOptions: { quoted: msg } });

      // Télécharger l'image originale
      const imgBuf = await getImageBuffer(sock, msg);
      if (!imgBuf) throw new Error('Impossible de lire l\'image');

      let resultBuf = null;

      // ── API drexapp (upload URL + resize) ──────────────────────────────
      try {
        // Convertir le buffer en data URL base64 pour l'envoyer
        const base64  = imgBuf.toString('base64');
        const dataUrl = `data:image/jpeg;base64,${base64}`;

        // Calculer les dimensions finales si pourcentage
        let finalW = width, finalH = height;
        if (isPercent) {
          // On a besoin des dimensions originales — utiliser Jimp si dispo
          try {
            const Jimp = require('jimp');
            const jimg = await Jimp.read(imgBuf);
            finalW = Math.round(jimg.bitmap.width  * percentVal / 100);
            finalH = Math.round(jimg.bitmap.height * percentVal / 100);
          } catch (e) {
            finalW = finalH = Math.round(512 * percentVal / 100);
          }
        }

        resultBuf = await resizeWithDrex(dataUrl, finalW, finalH);
      } catch (e) {
        console.log('[RESIZE] drexapp échoué:', e.message);
      }

      // ── Fallback : Jimp local ───────────────────────────────────────────
      if (!resultBuf) {
        try {
          const Jimp = require('jimp');
          const jimg = await Jimp.read(imgBuf);

          let finalW = width, finalH = height;
          if (isPercent) {
            finalW = Math.round(jimg.bitmap.width  * percentVal / 100);
            finalH = Math.round(jimg.bitmap.height * percentVal / 100);
          }

          jimg.resize(finalW, finalH);
          resultBuf = await jimg.getBufferAsync(Jimp.MIME_JPEG);
          width = finalW; height = finalH;
        } catch (e) {
          throw new Error('Jimp non disponible. Lance : npm install jimp');
        }
      }

      const finalW = isPercent ? Math.round(width  * percentVal / 100) : width;
      const finalH = isPercent ? Math.round(height * percentVal / 100) : height;

      await sock.sendMessage(jid, {
        image: resultBuf,
        caption:
          `📐 *Image redimensionnée*\n` +
          (isPercent
            ? `📏 Taille : *${percentVal}%*\n`
            : `📏 Taille : *${width}×${height} px*\n`) +
          `\n> *ZERO TRACE BOT v5.0*`,
        mimetype: 'image/jpeg',
      }, { quoted: msg });

      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});

    } catch (err) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, {
        text: `❌ Erreur resize : ${err.message}\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};
