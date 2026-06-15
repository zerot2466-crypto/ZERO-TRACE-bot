/**
 * ZERO TRACE BOT v5.0 — Commande .owner
 * Affiche la carte du propriétaire + joue le son owner
 */
'use strict';

const fs       = require('fs');
const path     = require('path');
const settings = require('../settings');
const config   = require('../config');

const ASSETS_DIR      = path.join(__dirname, '../assets');
const BOT_IMAGE       = path.join(ASSETS_DIR, 'bot_image.jpg');
const OWNER_SOUND     = path.join(ASSETS_DIR, 'owner_sound.mp3');

module.exports = {
  name:        'owner',
  aliases:     ['proprio', 'contact'],
  description: 'Affiche les infos du propriétaire du bot',
  usage:       '.owner',
  category:    'owner',

  async execute(ctx) {
    const { sock, jid, msg, antiBan } = ctx;
    const prefix = config.getPrefix();

    const ownerNum = settings.ownerNumber.replace(/[^0-9]/g, '');
    const waLink   = `https://wa.me/${ownerNum}`;

    const card =
      `╔══════════════════════════╗\n` +
      `║  👑 *PROPRIÉTAIRE DU BOT*  ║\n` +
      `╚══════════════════════════╝\n\n` +
      `🤖 Bot    : *${settings.botName}*\n` +
      `📦 Version: *${settings.version}*\n` +
      `👤 Owner  : *Shadow Senku DEV√√*\n` +
      `📞 Contact: wa.me/${ownerNum}\n\n` +
      `💡 Pour contacter l'owner :\n` +
      `▸ ${waLink}\n\n` +
      `> _ZERO TRACE BOT v5.0_`;

    // Envoyer la carte avec image si disponible
    if (fs.existsSync(BOT_IMAGE)) {
      try {
        const buf = fs.readFileSync(BOT_IMAGE);
        await sock.sendMessage(jid, {
          image: buf,
          caption: card,
          mimetype: 'image/jpeg',
        }, { quoted: msg });
      } catch (e) {
        await antiBan.safeSend(sock, jid, { text: card }, { msgOptions: { quoted: msg } });
      }
    } else {
      await antiBan.safeSend(sock, jid, { text: card }, { msgOptions: { quoted: msg } });
    }

    // 🔊 Jouer le son owner
    if (fs.existsSync(OWNER_SOUND)) {
      try {
        const audio = fs.readFileSync(OWNER_SOUND);
        await sock.sendMessage(jid, {
          audio,
          mimetype: 'audio/mpeg',
          ptt: false,
        });
      } catch (e) {
        console.error('[OWNER CMD] Erreur son:', e.message);
      }
    }
  },
};
