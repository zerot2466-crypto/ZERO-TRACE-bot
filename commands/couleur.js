/**
 * ZERO TRACE BOT v5.0 — .couleur
 * Génère une couleur aléatoire
 */
'use strict';
module.exports = {
  name: 'couleur',
  description: 'Génère une couleur aléatoire avec son code hex/RGB',
  usage: '.couleur | .couleur [#hexcode]',
  category: 'fun',
  async execute(ctx) {
    const { sock, jid, msg, args, antiBan } = ctx;
    let hex;
    if (args[0]?.startsWith('#')) {
      hex = args[0].replace('#', '').slice(0, 6).toUpperCase();
      if (!/^[0-9A-F]{6}$/.test(hex)) {
        await antiBan.safeSend(sock, jid, { text: '❌ Code hex invalide. Ex: .couleur #FF5733' }, { msgOptions: { quoted: msg } });
        return;
      }
    } else {
      hex = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0').toUpperCase();
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    const bright = luminance > 128 ? '☀️ Claire' : '🌑 Sombre';
    const hue = Math.round(Math.atan2(Math.sqrt(3) * (g - b), 2 * r - g - b) * 180 / Math.PI);
    await antiBan.safeSend(sock, jid, {
      text: `🎨 *COULEUR GÉNÉRÉE*\n\n` +
        `🟦 HEX : *#${hex}*\n` +
        `🔴 Rouge : *${r}*\n` +
        `🟢 Vert  : *${g}*\n` +
        `🔵 Bleu  : *${b}*\n` +
        `💡 RGB   : *rgb(${r}, ${g}, ${b})*\n` +
        `🌗 Tonalité : *${bright}*\n\n` +
        `> _ZERO TRACE 😈_`,
    }, { msgOptions: { quoted: msg } });
  },
};
