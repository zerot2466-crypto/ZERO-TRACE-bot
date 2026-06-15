const { HOROSCOPES } = require('./truth');
module.exports = {
  name: 'horoscope',
  description: 'Horoscope du jour',
  usage: '.horoscope [signe]',
  category: 'fun',
  async execute(ctx) {
    const { sock, jid, msg, args, antiBan } = ctx;
    const signe = (args[0] || '').toLowerCase().replace('é','e').replace('è','e');
    const result = HOROSCOPES[signe];
    if (!result) {
      const list = Object.keys(HOROSCOPES).join(', ');
      await antiBan.safeSend(sock, jid, {
        text: `⭐ *HOROSCOPE*\n\nSigles disponibles :\n${list}\n\nEx: *.horoscope lion*`,
      }, { msgOptions: { quoted: msg } });
      return;
    }
    await antiBan.safeSend(sock, jid, {
      text: `⭐ *HOROSCOPE DU JOUR*\n\n${result}\n\n> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};
