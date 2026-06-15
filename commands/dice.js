/**
 * ZERO TRACE BOT v5.0 — .dice / .de
 * Lancer des dés
 */
'use strict';
module.exports = {
  name: 'dice',
  description: 'Lancer un ou plusieurs dés',
  usage: '.dice [nombre_dés] [faces] — ex: .dice 2 6',
  category: 'fun',
  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, pushName } = ctx;
    const nb    = Math.min(parseInt(args[0]) || 1, 10);
    const faces = Math.min(parseInt(args[1]) || 6, 100);
    const EMOJIS = ['','⚀','⚁','⚂','⚃','⚄','⚅'];
    const rolls = Array.from({ length: nb }, () => Math.floor(Math.random() * faces) + 1);
    const total = rolls.reduce((a, b) => a + b, 0);
    const affiche = faces === 6
      ? rolls.map(r => EMOJIS[r] || `[${r}]`).join(' ')
      : rolls.map(r => `[${r}]`).join(' ');
    await antiBan.safeSend(sock, jid, {
      text:
      `🎲 *GÉNÉRATEUR ALÉATOIRE — ZT*\n▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n👾 ${pushName} lance ${nb} dé${nb > 1 ? 's' : ''} (${faces} faces)\n\n${affiche}\n\n` +
        (nb > 1 ? `Total : *${total}*\n\n` : '') +
        `> _ZERO TRACE 😈_`,
    }, { msgOptions: { quoted: msg } });
  },
};
