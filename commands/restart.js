const zts = require('../lib/ztStyle');
/**
 * ZERO TRACE BOT v5.0 - Restart
 * .restart → Redémarrer le bot à distance
 */
module.exports = {
  name: 'restart',
  description: 'Redémarrer le bot',
  usage: '.restart',
  category: 'owner',

  async execute(ctx) {
    const { sock, jid, msg, antiBan, isOwner } = ctx;

    if (!isOwner) {
      await antiBan.safeSend(sock, jid, { text: zts.randErr(zts.OWNER_ERRORS) }, { msgOptions: { quoted: msg } });
      return;
    }

    await antiBan.safeSend(sock, jid, {
      text:
        `🔄 *Redémarrage en cours...*\n\n` +
        `Le bot sera de retour dans quelques secondes.\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });

    setTimeout(() => process.exit(0), 2000);
  },
};
