const zts = require('../lib/ztStyle');
/**
 * .rps — Pierre Feuille Ciseaux
 */
const CHOIX = ['pierre', 'feuille', 'ciseaux'];
const EMOJI = { pierre: '🪨', feuille: '📄', ciseaux: '✂️' };
const GAGNE = { pierre: 'ciseaux', feuille: 'pierre', ciseaux: 'feuille' };
module.exports = {
  name: 'rps',
  description: 'Pierre Feuille Ciseaux contre le bot',
  usage: '.rps [pierre|feuille|ciseaux]',
  category: 'fun',
  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, pushName } = ctx;
    const choixJoueur = args[0]?.toLowerCase();
    if (!choixJoueur || !CHOIX.includes(choixJoueur)) {
      await antiBan.safeSend(sock, jid, {
        text:
        `⚔️ *BATTLE MODE — PIERRE FEUILLE CISEAUX*\n▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\nChoisis ton arme :\n› \`.rps pierre\`  🪨\n› \`.rps feuille\` 📄\n› \`.rps ciseaux\` ✂️\n\n> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }
    const choixBot = CHOIX[Math.floor(Math.random() * 3)];
    let resultat;
    if (choixJoueur === choixBot) resultat = '🤝 Égalité !';
    else if (GAGNE[choixJoueur] === choixBot) resultat = `🏆 ${pushName} gagne !`;
    else resultat = '🤖 Le bot gagne !';
    await antiBan.safeSend(sock, jid, {
      text:
      `⚔️ *BATTLE REPORT*\n▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n👾 ${pushName}  : ${EMOJI[choixJoueur]} ${choixJoueur}\n🤖 ZERO TRACE : ${EMOJI[choixBot]} ${choixBot}\n\n${resultat}\n\n> ${zts.sig()}`,
    }, { msgOptions: { quoted: msg } });
  },
};
