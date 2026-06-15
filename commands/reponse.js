/**
 * ZERO TRACE BOT v5.0 - Réponse à la devinette
 */
const { pending } = require('./riddle');
module.exports = {
  name: 'reponse',
  description: 'Répondre à une devinette',
  usage: '.reponse [ta réponse]',
  category: 'fun',
  async execute(ctx) {
    const { sock, jid, msg, args, antiBan } = ctx;
    const answer = args.join(' ').toLowerCase().trim();
    if (!pending.has(jid)) {
      await antiBan.safeSend(sock, jid, { text: '❌ Aucune devinette en cours. Utilise *.riddle* pour commencer.' }, { msgOptions: { quoted: msg } });
      return;
    }
    const correct = pending.get(jid);
    if (answer.includes(correct) || correct.includes(answer)) {
      pending.delete(jid);
      await antiBan.safeSend(sock, jid, {
        text: `✅ *BRAVO !* C'était la bonne réponse !\n\n📌 Réponse : *${correct}*\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    } else {
      await antiBan.safeSend(sock, jid, {
        text: `❌ *Mauvaise réponse !* Essaie encore...\nIndice : ça commence par *${correct[0].toUpperCase()}*`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};
