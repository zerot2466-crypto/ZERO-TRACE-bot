/**
 * ZERO TRACE BOT v5.0 — Commande .info (améliorée)
 */
'use strict';

const fs       = require('fs');
const path     = require('path');
const settings = require('../settings');
const config   = require('../config');

const BOT_IMAGE = path.join(__dirname, '../assets/bot_image.jpg');

module.exports = {
  name:    'info',
  description: 'Informations complètes sur le bot',
  usage:   '.info',
  category: 'util',

  async execute(ctx) {
    const { sock, jid, msg, antiBan, isOwner, isSudo } = ctx;
    const prefix = config.getPrefix();

    const sudoCount  = config.getSudoUsers().length;
    const privMode   = config.isPrivateMode();
    const ram        = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
    const uptime     = process.uptime();
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);

    const text =
      `╔══════════════════════════════╗\n` +
      `║  💀 *ZERO TRACE BOT — INFO*  ║\n` +
      `╚══════════════════════════════╝\n\n` +
      `🤖 *Nom :* ${settings.botName}\n` +
      `📦 *Version :* ${settings.version}\n` +
      `⚡ *Préfixe :* \`${prefix}\`\n` +
      `👤 *Owner :* +${settings.ownerNumber}\n` +
      `🛡️ *Sudos :* ${sudoCount} utilisateur${sudoCount > 1 ? 's' : ''}\n` +
      `🔒 *Mode privé :* ${privMode ? 'Activé 🔒' : 'Désactivé 🌐'}\n\n` +
      `💾 *RAM :* ${ram} MB\n` +
      `⏱️ *Uptime :* ${h}h ${m}m\n\n` +
      `📝 *Description :*\n_${settings.description}_\n\n` +
      `💡 *Utilisation :*\n` +
      `• Préfixe : \`${prefix}help\`\n` +
      `• Naturel : _"zero trace ouvre le menu"_\n\n` +
      (settings.channelLink ? `📢 *Canal :* ${settings.channelLink}\n` : '') +
      `\n> *ZERO TRACE BOT v5.0*`;

    if (fs.existsSync(BOT_IMAGE)) {
      try {
        const buf = fs.readFileSync(BOT_IMAGE);
        await sock.sendMessage(jid, { image: buf, caption: text, mimetype: 'image/jpeg' }, { quoted: msg });
        return;
      } catch (e) {}
    }

    await antiBan.safeSend(sock, jid, { text }, { msgOptions: { quoted: msg } });
  },
};
