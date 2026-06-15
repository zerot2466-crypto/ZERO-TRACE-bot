'use strict';
const fs       = require('fs');
const path     = require('path');
const settings = require('../settings');
const config   = require('../config');
const zts      = require('../lib/ztStyle');

const BOT_IMAGE = path.join(__dirname, '../assets/bot_image.jpg');

module.exports = {
  name: 'alive', aliases: ['uptime', 'status'],
  description: 'Vérifier que le bot est en vie',
  usage: '.alive', category: 'util',

  async execute(ctx) {
    const { sock, jid, msg, antiBan, pushName, isOwner, isSudo } = ctx;
    const up  = process.uptime();
    const h   = Math.floor(up / 3600);
    const m   = Math.floor((up % 3600) / 60);
    const s   = Math.floor(up % 60);
    const ram = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
    const ramT= (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(1);
    const pfx = config.getPrefix();
    const bar = up < 300 ? '🔴 Démarrage récent' : up < 3600 ? '🟡 Stable' : '🟢 OPÉRATIONNEL';
    const role= isOwner ? '👑 ROOT' : isSudo ? '🛡️ SUDO' : '👾 USER';

    const text =
      `╔═══════════════════════════════╗\n` +
      `║  💀  ZERO TRACE — SYSTÈME  💀  ║\n` +
      `║    _Ghost Mode : ACTIVE_       ║\n` +
      `╚═══════════════════════════════╝\n\n` +
      `\`\`\`[ZT-OS] Rapport système\n` +
      `Status     : ONLINE ████████ 100%\n` +
      `Uptime     : ${h}h ${m}m ${s}s\n` +
      `RAM        : ${ram} / ${ramT} MB\n` +
      `Niveau     : ${role}\n` +
      `Prefix     : ${pfx}\n` +
      `Signal     : ${bar}\n` +
      `Version    : ZERO TRACE v${settings.version || '5.0'}\`\`\`\n\n` +
      `🔮 *Réseau sécurisé. Identité masquée.*\n` +
      `_"Dans l'ombre, je veille sur chaque octet."_\n\n` +
      `> ${zts.sig()}`;

    if (fs.existsSync(BOT_IMAGE)) {
      try {
        await sock.sendMessage(jid, { image: fs.readFileSync(BOT_IMAGE), caption: text }, { quoted: msg });
        return;
      } catch (e) {}
    }
    await antiBan.safeSend(sock, jid, { text }, { msgOptions: { quoted: msg } });
  },
};
