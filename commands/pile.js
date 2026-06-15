/**
 * ZERO TRACE BOT v5.0 — .pile
 * Pile ou face
 */
'use strict';
module.exports = {
  name: 'pile',
  description: 'Pile ou Face aléatoire',
  usage: '.pile | .face',
  category: 'fun',
  async execute(ctx) {
    const { sock, jid, msg, antiBan, pushName } = ctx;
    const res = Math.random() < 0.5;
    await antiBan.safeSend(sock, jid, {
      text: `🪙 *PILE OU FACE*\n\n${pushName} lance la pièce...\n\n` +
        `Résultat : ${res ? '🟡 *PILE*' : '⚪ *FACE*'}\n\n> _ZERO TRACE 😈_`,
    }, { msgOptions: { quoted: msg } });
  },
};
