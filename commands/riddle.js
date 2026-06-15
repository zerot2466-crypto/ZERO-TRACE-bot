const { RIDDLES, getRandom } = require('./truth');
const pending = new Map();
module.exports = {
  name: 'riddle',
  description: 'Une devinette à résoudre',
  usage: '.riddle',
  category: 'fun',
  async execute(ctx) {
    const { sock, jid, msg, antiBan } = ctx;
    const r = getRandom(RIDDLES);
    pending.set(jid, r.a.toLowerCase());
    await antiBan.safeSend(sock, jid, {
      text: `🧩 *DEVINETTE*\n\n${r.q}\n\nRéponds avec *.reponse [ta réponse]*\n\n> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
  pending,
};
