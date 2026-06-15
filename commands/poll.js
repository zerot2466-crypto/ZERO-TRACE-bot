/**
 * ZERO TRACE BOT v5.0 - Poll (Sondage)
 * .poll Question | Option1 | Option2 | Option3
 */
module.exports = {
  name: 'poll',
  description: 'Créer un sondage dans le groupe',
  usage: '.poll Question | Option1 | Option2 | ...',
  category: 'util',

  async execute(ctx) {
    const { sock, jid, msg, antiBan, body, prefix } = ctx;

    const content = body.slice((prefix + 'poll').length).trim();
    if (!content) {
      await antiBan.safeSend(sock, jid, {
        text:
          `📊 *SONDAGE*\n\n` +
          `Utilise : *.poll Question | Option1 | Option2 | Option3*\n\n` +
          `Exemple :\n*.poll Meilleur fruit ? | Mangue | Banane | Ananas*`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const parts = content.split('|').map(p => p.trim()).filter(Boolean);
    if (parts.length < 3) {
      await antiBan.safeSend(sock, jid, {
        text: '❌ Il faut au moins une question et 2 options.\nEx : *.poll Question | Option1 | Option2*',
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const question = parts[0];
    const options  = parts.slice(1).slice(0, 12); // Max 12 options WhatsApp

    try {
      await sock.sendMessage(jid, {
        poll: {
          name: question,
          values: options,
          selectableCount: 1,
        },
      });
    } catch (e) {
      // Fallback texte si les polls ne sont pas supportés
      const nums = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','1️⃣1️⃣','1️⃣2️⃣'];
      const opts = options.map((o, i) => `${nums[i]} ${o}`).join('\n');
      await antiBan.safeSend(sock, jid, {
        text: `📊 *SONDAGE*\n\n❓ *${question}*\n\n${opts}\n\nVote avec le numéro correspondant !\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};
