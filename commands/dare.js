const { DARES, getRandom } = require('./truth');
module.exports = {
  name: 'dare',
  description: 'Défi aléatoire',
  usage: '.dare',
  category: 'fun',
  async execute(ctx) {
    const { sock, jid, msg, antiBan } = ctx;
    await antiBan.safeSend(sock, jid, {
      text: `🔥 *DÉFI*\n\n${getRandom(DARES)}\n\n> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};
