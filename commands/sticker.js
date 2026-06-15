/**
 * ZERO TRACE BOT v5.0 — .sticker v2
 * Convertir image/vidéo/GIF en sticker WhatsApp
 * ✅ ffmpeg optimisé (512x512, transparence, compression adaptative)
 * ✅ Métadonnées pack name via node-webpmux
 * ✅ Fallback si webpmux absent
 * ✅ Nettoyage garanti des fichiers temp
 */
'use strict';

const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec }   = require('child_process');
const fs         = require('fs');
const path       = require('path');
const crypto     = require('crypto');
const settings   = require('../settings');

// ── Helper : exécuter ffmpeg ──────────────────────────────────────────────────
function runFFmpeg(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout: 60000 }, (err) => (err ? reject(err) : resolve()));
  });
}

// ── Helper : ajouter métadonnées EXIF WebP ────────────────────────────────────
async function addWebpMeta(buffer, packName = 'ZERO TRACE', authorName = 'ZT Bot') {
  try {
    const webp = require('node-webpmux');
    const img  = new webp.Image();
    await img.load(buffer);
    const json = {
      'sticker-pack-id':     crypto.randomBytes(16).toString('hex'),
      'sticker-pack-name':   packName,
      'sticker-pack-author': authorName,
      'emojis':              ['🤖', '💀'],
    };
    const exifAttr  = Buffer.from([0x49,0x49,0x2A,0x00,0x08,0x00,0x00,0x00,0x01,0x00,0x41,0x57,0x07,0x00,0x00,0x00,0x00,0x00,0x16,0x00,0x00,0x00]);
    const jsonBuf   = Buffer.from(JSON.stringify(json), 'utf8');
    const exif      = Buffer.concat([exifAttr, jsonBuf]);
    exif.writeUIntLE(jsonBuf.length, 14, 4);
    img.exif = exif;
    return await img.save(null);
  } catch {
    return buffer; // pas de webpmux → renvoyer tel quel
  }
}

module.exports = {
  name:        'sticker',
  aliases:     ['s', 'stiker', 'autocollant'],
  description: 'Convertir une image/vidéo/GIF en sticker WhatsApp',
  usage:       '.sticker | .s  (envoie ou cite une image/vidéo)',
  category:    'media',

  async execute(ctx) {
    const { sock, jid, msg, antiBan } = ctx;

    // ── Trouver le média (direct ou cité) ─────────────────────────────────
    const quotedCtx = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMsg = quotedCtx?.quotedMessage;

    const directImage = msg.message?.imageMessage;
    const directVideo = msg.message?.videoMessage;
    const quotedImage = quotedMsg?.imageMessage;
    const quotedVideo = quotedMsg?.videoMessage;

    const mediaMsg  = directImage || directVideo || quotedImage || quotedVideo;
    const mediaType = directImage  ? 'image'
                    : directVideo  ? 'video'
                    : quotedImage  ? 'image'
                    : quotedVideo  ? 'video'
                    : null;

    if (!mediaMsg || !mediaType) {
      await antiBan.safeSend(sock, jid, {
        text:
          `🖼️ *Commande Sticker*\n\n` +
          `Envoie une image/vidéo avec la légende *.sticker* (ou *.s*),\n` +
          `ou réponds à un media existant avec *.sticker*\n\n` +
          `📌 Supporte : image, vidéo courte, GIF\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } }).catch(() => {});
    await antiBan.safeSend(sock, jid, { text: `🎴 _Compilation du sticker en cours..._` }, { msgOptions: { quoted: msg } });

    // ── Dossier tmp ────────────────────────────────────────────────────────
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const stamp      = Date.now();
    const tempInput  = path.join(tmpDir, `stk_in_${stamp}`);
    const tempOutput = path.join(tmpDir, `stk_out_${stamp}.webp`);

    const cleanup = () => {
      for (const f of [tempInput, tempOutput]) {
        try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {}
      }
    };

    try {
      // ── Télécharger le média ─────────────────────────────────────────────
      let msgForDownload = msg;
      if ((quotedImage || quotedVideo) && quotedCtx) {
        msgForDownload = {
          key:     { remoteJid: jid, id: quotedCtx.stanzaId || '' },
          message: quotedMsg,
        };
      }

      const buffer = await downloadMediaMessage(
        msgForDownload, 'buffer', {},
        {}  // compat Baileys 6.x
      );
      if (!buffer || buffer.length < 100) throw new Error('Fichier vide ou corrompu');

      fs.writeFileSync(tempInput, buffer);

      // ── Détecter si animé ────────────────────────────────────────────────
      const isAnimated = mediaType === 'video'
        || mediaMsg.mimetype?.includes('gif')
        || (mediaMsg.seconds && mediaMsg.seconds > 0);

      const fileSizeKB = buffer.length / 1024;

      // ── Choisir la commande ffmpeg selon le type ──────────────────────────
      let ffCmd;
      if (!isAnimated) {
        // Image statique → WebP 512x512 avec transparence
        ffCmd = `ffmpeg -y -i "${tempInput}" \
          -vf "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" \
          -c:v libwebp -preset default -loop 0 -pix_fmt yuva420p \
          -quality 80 -compression_level 6 "${tempOutput}"`;
      } else if (fileSizeKB > 5000) {
        // Vidéo lourde → compression agressive
        ffCmd = `ffmpeg -y -i "${tempInput}" -t 3 \
          -vf "scale=320:320:force_original_aspect_ratio=decrease,fps=8,pad=320:320:(ow-iw)/2:(oh-ih)/2:color=#00000000" \
          -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p \
          -quality 30 -compression_level 6 -b:v 80k "${tempOutput}"`;
      } else {
        // Vidéo / GIF normal → 512px animé
        ffCmd = `ffmpeg -y -i "${tempInput}" -t 6 \
          -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" \
          -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p \
          -quality 75 -compression_level 6 "${tempOutput}"`;
      }

      await runFFmpeg(ffCmd);

      if (!fs.existsSync(tempOutput)) throw new Error('FFmpeg n\'a pas généré le fichier WebP');

      let webpBuffer = fs.readFileSync(tempOutput);

      // ── Re-encoder si trop lourd (>900KB) ────────────────────────────────
      if (isAnimated && webpBuffer.length > 900 * 1024) {
        const tempFallback = path.join(tmpDir, `stk_fallback_${stamp}.webp`);
        try {
          const fallbackCmd = `ffmpeg -y -i "${tempInput}" -t 3 \
            -vf "scale=256:256:force_original_aspect_ratio=decrease,fps=8,pad=256:256:(ow-iw)/2:(oh-ih)/2:color=#00000000" \
            -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p \
            -quality 35 -compression_level 6 -b:v 80k "${tempFallback}"`;
          await runFFmpeg(fallbackCmd);
          if (fs.existsSync(tempFallback)) {
            webpBuffer = fs.readFileSync(tempFallback);
            fs.unlinkSync(tempFallback);
          }
        } catch {}
      }

      // ── Ajouter métadonnées pack ──────────────────────────────────────────
      const packName = settings?.packname || 'ZERO TRACE';
      const finalBuffer = await addWebpMeta(webpBuffer, packName, 'ZT Bot 💀');

      // ── Envoyer le sticker ────────────────────────────────────────────────
      await sock.sendMessage(jid, { sticker: finalBuffer }, { quoted: msg });
      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});

    } catch (err) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      console.error('[STICKER] Erreur:', err.message);
      await antiBan.safeSend(sock, jid, {
        text:
          `❌ *Erreur lors de la création du sticker*\n\n` +
          `_${err.message}_\n\n` +
          `💡 Vérifie que ffmpeg est bien installé :\n` +
          `\`npm install\` puis \`apt install ffmpeg\`\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    } finally {
      cleanup();
    }
  },
};
