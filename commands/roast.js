const zts = require('../lib/ztStyle');
/**
 * ZERO TRACE BOT v5.0 - Roast & Compliment
 */
const ROASTS = [
  "T'es tellement lent que même Google te dit 'connexion expirée' avant que tu finisses une phrase. 😂",
  "T'as le QI d'une plante verte... et encore, la plante fait de la photosynthèse, elle. 🌿",
  "Si la bêtise était une compétition olympique, tu serais sur le podium avec une médaille d'or. 🥇",
  "Tu ressembles à un WiFi en zone rurale — tout le monde t'ignore et personne ne veut se connecter. 📶",
  "T'es la preuve vivante que l'évolution peut parfois faire marche arrière. 🐒",
  "Ton cerveau est tellement petit que si on le mettait dans une fourmi, elle marcherait en cercle. 🐜",
  "Les gens ne te détestent pas... ils font juste semblant de t'aimer quand t'es là. 🙃",
  "T'es tellement ennuyeux que ton propre écho te raccroche au nez. 📞",
  "Ta personnalité a plus de bugs que Windows Vista. 💻",
  "T'as été créé à la va-vite un vendredi après-midi, ça se voit. 😴",
];

const COMPLIMENTS = [
  "Tu illumines n'importe quelle pièce où tu entres. Continue comme ça ! ☀️",
  "Ta présence dans ce groupe le rend automatiquement plus intéressant. 🔥",
  "Tu as un talent rare pour rendre les gens heureux autour de toi. 😊",
  "Ton sens de l'humour est inarrêtable. Tu devrais faire du stand-up. 😂",
  "Tu es exactement le type de personne que tout groupe a besoin. 💪",
  "Ta créativité est impressionnante. Continue à surprendre tout le monde ! 🎨",
  "Tu es quelqu'un de vraiment rare — honnête, drôle et intelligent à la fois. 👑",
  "Les gens comme toi sont la raison pour laquelle on croit encore aux bonnes personnes. ❤️",
  "Tu as une énergie unique qui est contagieuse de la meilleure façon possible. ⚡",
  "Ton sourire peut changer la journée de n'importe qui. N'arrête jamais. 😁",
];

function getRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

module.exports = {
  name: 'roast',
  description: 'Insulte drôle envers un membre',
  usage: '.roast @user',
  category: 'fun',

  async execute(ctx) {
    const { sock, jid, msg, antiBan } = ctx;
    const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target = mentions[0];

    if (!target) {
      await antiBan.safeSend(sock, jid, { text: `\`\`\`[ZT-ROAST] Usage: .roast @cible\`\`\`\n\n> ${zts.sig()}` }, { msgOptions: { quoted: msg } });
      return;
    }

    const num = target.split('@')[0];
    await antiBan.safeSend(sock, jid, {
      text:
      `🔥 *ATTAQUE VERBALE INITIÉE*\n▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n🎯 Cible : @${num}\n\n${getRandom(ROASTS)}\n\n> ${zts.sig()}`,
      mentions: [target],
    }, { msgOptions: { quoted: msg } });
  },
};

module.exports.COMPLIMENTS = COMPLIMENTS;
module.exports.getRandom = getRandom;
