const zts = require('../lib/ztStyle');
/**
 * .8ball — Boule magique (réponses aléatoires IA-style)
 */
const reponses = [
  "C'est certain.", "Sans aucun doute.", "Oui, définitivement.",
  "Tu peux compter dessus.", "Très probablement.", "Les signes disent oui.",
  "Les perspectives sont bonnes.", "Oui.", "Les signes pointent vers oui.",
  "Réponds encore plus tard.", "C'est difficile à prédire maintenant.",
  "Concentre-toi et redemande.", "Ne compte pas là-dessus.", "Ma réponse est non.",
  "Mes sources disent non.", "Les perspectives ne sont pas bonnes.", "Très douteux.",
  "Bah... pas sûr du tout.", "L'univers dit NON.", "Clairement oui, ne doute pas.",
];
module.exports = {
  name: '8ball',
  description: 'Pose une question à la boule magique',
  usage: '.8ball [question]',
  category: 'fun',
  async execute(ctx) {
    const { sock, jid, msg, args, antiBan } = ctx;
    const question = args.join(' ').trim();
    if (!question) {
      await antiBan.safeSend(sock, jid, { text: `🔮 *ORACLE ZERO TRACE*\n▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\nPose une question à l\'oracle.\nEx: \`.8ball Vais-je réussir ?\`\n\n> ${zts.sig()}` }, { msgOptions: { quoted: msg } });
      return;
    }
    const rep = reponses[Math.floor(Math.random() * reponses.length)];
    await antiBan.safeSend(sock, jid, {
      text:
      `🔮 *ORACLE ZERO TRACE*\n▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n❓ Question : _${question}_\n\n🎴 Réponse de l\'oracle :\n*${rep}*\n\n> ${zts.sig()}`,
    }, { msgOptions: { quoted: msg } });
  },
};
