/**
 * ZERO TRACE BOT v3.0 - Commande SetPrefix
 */

const config = require('../config');

module.exports = {
  name: 'setprefix',
  description: 'Changer le préfixe du bot',
  usage: '.setprefix [nouveau préfixe]',
  category: 'util',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, isOwner } = ctx;

    if (!isOwner) {
      await antiBan.safeSend(sock, jid, {
        text: '❌ Seul le propriétaire peut changer le préfixe.',
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const newPrefix = args[0];
    if (!newPrefix || newPrefix.length > 3) {
      await antiBan.safeSend(sock, jid, {
        text: `⚙️ *Changer le Préfixe*\n\nUsage: *.setprefix [nouveau]*\n\nExemples:\n• .setprefix !\n• .setprefix /\n• .setprefix #\n\nPréfixe actuel: *${config.getPrefix()}*`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const oldPrefix = config.getPrefix();
    config.setPrefix(newPrefix);

    await antiBan.safeSend(sock, jid, {
      text: `✅ *Préfixe changé !*\n\n${oldPrefix} → *${newPrefix}*\n\nUtilise maintenant *${newPrefix}help* pour le menu.`,
    }, { msgOptions: { quoted: msg } });
  },
};
