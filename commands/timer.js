/**
 * ZERO TRACE BOT v5.0 — .timer
 * Compte à rebours dans le groupe
 */
'use strict';
const zts = require('../lib/ztStyle');
const TIMERS = {};

module.exports = {
  name: 'timer',
  description: 'Lance un compte à rebours dans le groupe',
  usage: '.timer [durée] — ex: .timer 5m | .timer 30s | .timer 1h | .timer stop',
  category: 'util',
  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, pushName } = ctx;
    const input = args[0]?.toLowerCase();

    if (input === 'stop') {
      if (TIMERS[jid]) { clearTimeout(TIMERS[jid]); delete TIMERS[jid]; }
      await antiBan.safeSend(sock, jid, { text: '⏹️ Timer arrêté.' }, { msgOptions: { quoted: msg } });
      return;
    }

    if (!input) {
      await antiBan.safeSend(sock, jid, { text: `\`\`\`[ZT-TIMER] Usage: .timer [durée]\nEx : .timer 30s | .timer 5m | .timer 1h\`\`\`\n\n> ${zts.sig()}` }, { msgOptions: { quoted: msg } });
      return;
    }

    let secondes = 0;
    if (input.endsWith('s'))      secondes = parseInt(input);
    else if (input.endsWith('m')) secondes = parseInt(input) * 60;
    else if (input.endsWith('h')) secondes = parseInt(input) * 3600;
    else                          secondes = parseInt(input);

    if (!secondes || secondes < 1 || secondes > 7200) {
      await antiBan.safeSend(sock, jid, { text: `\`\`\`[ZT-TIMER] ERREUR: Durée invalide (max 2h)\`\`\`\n\n> ${zts.sig()}` }, { msgOptions: { quoted: msg } });
      return;
    }

    const h = Math.floor(secondes / 3600);
    const m = Math.floor((secondes % 3600) / 60);
    const s = secondes % 60;
    const label = [h && `${h}h`, m && `${m}m`, s && `${s}s`].filter(Boolean).join(' ');

    await antiBan.safeSend(sock, jid, {
      text: `⏱️ *TIMER lancé par ${pushName}*\n⏳ Durée : *${label}*\n\nJe vous avertirai dans ${label} !`,
    }, { msgOptions: { quoted: msg } });

    if (TIMERS[jid]) clearTimeout(TIMERS[jid]);
    TIMERS[jid] = setTimeout(async () => {
      delete TIMERS[jid];
      try {
        await antiBan.safeSend(sock, jid, {
          text: `🔔 *TIMER TERMINÉ !*\n⏱️ ${label} se sont écoulés !\n_(Timer lancé par ${pushName})_\n\n> _ZERO TRACE 😈_`,
        }, {});
      } catch {}
    }, secondes * 1000);
  },
};
