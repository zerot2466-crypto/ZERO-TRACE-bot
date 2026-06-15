const zts = require('../lib/ztStyle');
/**
 * ZERO TRACE BOT v3.0 - Commande Quote / Proverbe / Citation
 */

const { QUOTES } = require('../lib/supremacy');

const LIFE_QUOTES = [
  '🌟 "Le succès c\'est tomber sept fois et se relever huit." — Proverbe japonais',
  '💪 "La seule façon de faire du bon travail, c\'est d\'aimer ce qu\'on fait." — Steve Jobs',
  '🧠 "L\'intelligence sans ambition est un oiseau sans ailes." — Salvador Dalí',
  '🌍 "Sois le changement que tu veux voir dans le monde." — Gandhi',
  '⚡ "Le génie, c\'est 1% d\'inspiration et 99% de transpiration." — Thomas Edison',
  '🎯 "Fixez des objectifs ambitieux et n\'ayez pas peur d\'échouer." — Serena Williams',
  '🔥 "La vie, c\'est ce qui se passe quand vous avez d\'autres projets." — John Lennon',
  '💡 "La créativité, c\'est l\'intelligence qui s\'amuse." — Albert Einstein',
  '🌙 "Dans les moments sombres, cherche la lumière en toi." — ZERO TRACE',
  '🚀 "Ne compte pas les jours. Fais que les jours comptent." — Muhammad Ali',
];

module.exports = {
  name: 'quote',
  description: 'Une citation ou proverbe aléatoire',
  usage: '.quote | .proverbe | .citation | "zero trace une citation"',
  category: 'fun',

  async execute(ctx) {
    const { sock, jid, msg, antiBan, pushName, modeType, args } = ctx;

    // Choisir le pool selon l'argument (optionnel)
    let pool;
    const type = args[0]?.toLowerCase();
    if (type === 'hacker' || type === 'hack') {
      pool = QUOTES;
    } else if (type === 'vie' || type === 'life') {
      pool = LIFE_QUOTES;
    } else {
      // Mélange les deux
      pool = [...QUOTES, ...LIFE_QUOTES];
    }

    const quote = pool[Math.floor(Math.random() * pool.length)];
    const intro = modeType === 'natural'
      ? `✨ Voilà une citation pour toi, *${pushName}* :\n\n`
      : '✨ *Citation du moment :*\n\n';

    await antiBan.safeSend(sock, jid, {
      text:
      `🔮 *ZERO TRACE — CITATION*\n▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n${quote}\n\n💡 _Catégories : .quote hacker | .quote vie | .quote anime_\n\n> ${zts.sig()}`,
    }, { msgOptions: { quoted: msg } });
  },
};
