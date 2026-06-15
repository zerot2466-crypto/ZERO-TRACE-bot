/**
 * ZERO TRACE BOT v5.0 - Truth / Dare / Roast / Compliment / Horoscope / Riddle
 */
const settings = require('../settings');

const TRUTHS = [
  "Quelle est la chose la plus embarrassante qui te soit arrivée ?",
  "As-tu déjà menti à ton meilleur ami ?",
  "Quel est ton plus grand secret ?",
  "As-tu déjà eu un crush sur quelqu'un dans ce groupe ?",
  "Quelle est la chose la plus stupide que tu aies faite par amour ?",
  "As-tu déjà triché à un examen ?",
  "Quelle est ta pire habitude ?",
  "As-tu déjà lu les messages privés de quelqu'un ?",
  "Quel est le mensonge le plus énorme que tu aies dit à tes parents ?",
  "As-tu déjà fait semblant d'être malade pour éviter quelqu'un ?",
  "Quelle est la chose dont tu es le plus honteux(se) ?",
  "As-tu un pseudo secret sur les réseaux ?",
];

const DARES = [
  "Envoie un selfie dans ce groupe maintenant !",
  "Écris 'Je suis nul(le)' en statut WhatsApp pendant 10 minutes.",
  "Appelle quelqu'un au hasard dans tes contacts et chante-lui une chanson.",
  "Envoie un message gênant à la dernière personne dans tes contacts.",
  "Imite la voix d'un admin du groupe pendant 2 messages.",
  "Change ton nom WhatsApp en 'Poule Mouillée' pendant 1 heure.",
  "Envoie un 'Je t'aime' à quelqu'un de ce groupe (au choix).",
  "Fais 10 pompes et envoie la preuve en vidéo.",
  "Dis un compliment sincère à chaque membre de ce groupe.",
  "Raconte une blague nulle. La pire possible.",
  "Envoie ton emoji le plus utilisé 50 fois d'affilée.",
  "Fais un karaoké vocal de 30 secondes dans le groupe.",
];

const HOROSCOPES = {
  bélier:    "♈ *Bélier* — L'énergie est de votre côté aujourd'hui. Foncez sans hésiter !",
  taureau:   "♉ *Taureau* — Une surprise financière agréable est possible. Restez vigilant.",
  gémeaux:   "♊ *Gémeaux* — Vos idées brillent. Partagez-les avec confiance.",
  cancer:    "♋ *Cancer* — La famille est au centre de votre journée. Profitez-en.",
  lion:      "♌ *Lion* — Votre charisme attire les regards. Assumez-le !",
  vierge:    "♍ *Vierge* — Organisation et rigueur vous mèneront au succès.",
  balance:   "♎ *Balance* — Une décision difficile se présente. Faites confiance à votre instinct.",
  scorpion:  "♏ *Scorpion* — Des révélations surprenantes arrivent. Gardez les yeux ouverts.",
  sagittaire:"♐ *Sagittaire* — L'aventure vous appelle. Sortez de votre zone de confort.",
  capricorne:"♑ *Capricorne* — La patience paie. Vos efforts sont sur le point de porter fruit.",
  verseau:   "♒ *Verseau* — Votre originalité est votre force aujourd'hui.",
  poissons:  "♓ *Poissons* — Votre intuition est au maximum. Écoutez-la.",
};

const RIDDLES = [
  { q: "J'ai des villes mais pas de maisons, des forêts mais pas d'arbres, et de l'eau mais pas de poissons. Qu'est-ce que je suis ?", a: "Une carte géographique" },
  { q: "Plus je sèche, plus je mouille. Qu'est-ce que je suis ?", a: "Une serviette" },
  { q: "Je parle sans bouche et j'entends sans oreilles. Qu'est-ce que je suis ?", a: "Un écho" },
  { q: "Qu'est-ce qui a des mains mais ne peut pas applaudir ?", a: "Une horloge" },
  { q: "Je suis toujours devant toi mais ne peut jamais être vu. Qu'est-ce que je suis ?", a: "L'avenir" },
  { q: "Qu'est-ce qui devient plus grand quand on en enlève ?", a: "Un trou" },
  { q: "Je suis léger comme une plume, mais même l'homme le plus fort ne peut me tenir longtemps. Qu'est-ce que je suis ?", a: "La respiration / le souffle" },
];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

module.exports = {
  name: 'truth',
  description: 'Question vérité aléatoire',
  usage: '.truth',
  category: 'fun',

  async execute(ctx) {
    const { sock, jid, msg, antiBan } = ctx;
    const truth = getRandom(TRUTHS);
    await antiBan.safeSend(sock, jid, {
      text: `🎯 *VÉRITÉ*\n\n${truth}\n\n> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

module.exports.TRUTHS  = TRUTHS;
module.exports.DARES   = DARES;
module.exports.HOROSCOPES = HOROSCOPES;
module.exports.RIDDLES = RIDDLES;
module.exports.getRandom = getRandom;
