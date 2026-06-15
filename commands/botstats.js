/**
 * ZERO TRACE BOT v5.0 — Commande .botstats
 * Usage : .botstats | .botstats reset
 */

'use strict';
const zts = require('../lib/ztStyle');

const usageStats = require('../lib/usageStats');

module.exports = {
  name: 'botstats',
  aliases: ['usage', 'botusage', 'statbot'],
  description: 'Voir les stats d\'usage du bot',
  usage: '.botstats [reset]',
  category: 'owner',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, isOwner, isSudo } = ctx;
    if (!isOwner && !isSudo) {
      await antiBan.safeSend(sock, jid, { text: zts.randErr(zts.OWNER_ERRORS) }, { msgOptions: { quoted: msg } });
      return;
    }

    if ((args[0] || '').toLowerCase() === 'reset') {
      usageStats.reset();
      await antiBan.safeSend(sock, jid, {
        text: `\`\`\`[ZT-OS] Stats réinitialisées\nStatus : RESET ✓\`\`\`\n\n> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    await antiBan.safeSend(sock, jid, {
      text: usageStats.getReport(),
    }, { msgOptions: { quoted: msg } });
  },
};
