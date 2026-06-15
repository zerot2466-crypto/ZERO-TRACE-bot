/**
 * ZERO TRACE BOT v3.0 - Commande Update
 * Vérifier et télécharger les mises à jour
 */

const settings = require('../settings');

module.exports = {
  name: 'update',
  description: 'Vérifier les mises à jour du bot',
  usage: '.update',
  category: 'util',

  async execute(ctx) {
    const { sock, jid, msg, antiBan, isOwner } = ctx;

    if (!isOwner) {
      await antiBan.safeSend(sock, jid, { text: '❌ Owner uniquement.' }, { msgOptions: { quoted: msg } });
      return;
    }

    await antiBan.safeSend(sock, jid, {
      text: `🔄 *ZERO TRACE BOT v${settings.version}*\n\n` +
        `📦 Version actuelle: *${settings.version}*\n` +
        `💡 Pour mettre à jour manuellement:\n` +
        `\`\`\`\ngit pull origin main\nnpm install\nnode index.js\n\`\`\``,
    }, { msgOptions: { quoted: msg } });
  },
};
