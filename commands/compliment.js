const { COMPLIMENTS, getRandom } = require('./roast');
module.exports = {
  name: 'compliment',
  description: 'Compliment pour un membre',
  usage: '.compliment @user',
  category: 'fun',
  async execute(ctx) {
    const { sock, jid, msg, antiBan } = ctx;
    const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target = mentions[0];
    if (!target) {
      await antiBan.safeSend(sock, jid, { text: '❌ Mentionne quelqu\'un : *.compliment @user*' }, { msgOptions: { quoted: msg } });
      return;
    }
    const num = target.split('@')[0];
    await antiBan.safeSend(sock, jid, {
      text: `💐 *COMPLIMENT — @${num}*\n\n${getRandom(COMPLIMENTS)}\n\n> *ZERO TRACE BOT v5.0*`,
      mentions: [target],
    }, { msgOptions: { quoted: msg } });
  },
};
