/**
 * ZERO TRACE BOT v5.0 - Célébrations
 * naissance · cremaillere · potdepart · soutenance · permis · bac
 * mariage · divorce · retraite · comingout · diplome · prenatal
 */

function getRandom(arr) { return arr[Math.floor(Math.random() * arr.length)];}

function buildMsg(emoji, titre, textes, pushName, target) {
  const dest = target || pushName;
  return (
    `${emoji} *${titre}*\n\n` +
    `🎊 *Pour ${dest}* 🎊\n\n` +
    `${getRandom(textes)}\n\n` +
    `> *ZERO TRACE BOT v5.0*`
  );
}

const MSGS = {
  naissance: [
    "Un nouveau rayon de soleil vient d'illuminer le monde ! Félicitations pour cette naissance ! 👶✨",
    "Bienvenue petit(e) bout de chou ! Le monde sera plus beau grâce à toi. 🍼💕",
    "Les plus beaux chapitres de la vie commencent toujours par une naissance. Félicitations ! 👣🌟",
  ],
  cremaillere: [
    "Un nouveau foyer, de nouvelles aventures ! Que cette maison soit remplie de bonheur et de rires ! 🏠🎉",
    "Félicitations pour ton nouveau chez-toi ! Que les murs de cette maison gardent mille souvenirs heureux. 🗝️✨",
    "Home sweet home ! Ta nouvelle demeure t'attend avec impatience. Bienvenue chez toi ! 🏡🥂",
  ],
  potdepart: [
    "Chaque départ est une nouvelle aventure qui commence. Tu vas nous manquer mais on te souhaite le meilleur ! 🚀💼",
    "Ce n'est pas un adieu, c'est un au revoir. Que ce nouveau chapitre soit le plus beau ! 🌅👋",
    "Tu pars mais tu laisses une trace indélébile. Bonne route et que le succès t'accompagne ! 🛤️⭐",
  ],
  soutenance: [
    "Des années de travail, des nuits blanches, des sacrifices... et aujourd'hui c'est ta victoire ! Félicitations Docteur/Master ! 🎓🏆",
    "La soutenance est passée, le titre est mérité ! Tout ce labeur trouve enfin sa récompense. Bravo ! 📚✨",
    "Tu as défendu ton travail avec brio ! Ce titre, personne ne pourra jamais te l'enlever. 🎓💪",
  ],
  permis: [
    "La route t'appartient désormais ! Félicitations pour ton permis de conduire ! 🚗🎉",
    "Permis en poche ! La liberté sur quatre roues t'attend. Conduis prudemment ! 🏎️✅",
    "Un nouveau conducteur sur les routes ! Félicitations — la prudence reste ton meilleur copilote. 🚦👏",
  ],
  bac: [
    "Le bac est décroché ! Toute ta persévérance trouve enfin sa récompense. Félicitations ! 📜🎓",
    "Tu as réussi ! Cette clé ouvre des portes infinies. Que ton avenir soit à la hauteur de tes rêves ! 🗝️🌟",
    "Bachelier(ère) ! Un cap difficile franchi avec succès. La vie adulte commence vraiment aujourd'hui ! 🎊📚",
  ],
  mariage: [
    "Que vos deux vies écrivent ensemble la plus belle des histoires ! Félicitations pour votre mariage ! 💍❤️",
    "L'amour, quand il est vrai, mérite d'être célébré. Longue vie à vous deux ! 💒🌹",
    "Aujourd'hui vous dites OUI pour l'éternité. Que chaque jour soit aussi beau que celui-ci ! 💕🎊",
  ],
  divorce: [
    "Parfois la liberté retrouvée est le plus beau des cadeaux. Un nouveau chapitre commence — profites-en ! 🦋✨",
    "Ce n'est pas une fin, c'est un nouveau départ vers ce qui te ressemble vraiment. Force à toi ! 🌅💪",
    "Bravo pour ce courage. Ta renaissance commence aujourd'hui. L'avenir t'appartient. 🌱🔓",
  ],
  retraite: [
    "Après toutes ces années de travail acharné, c'est enfin l'heure de profiter ! Bonne retraite bien méritée ! 🎊👴👵",
    "Ta nouvelle aventure commence : voyages, famille, loisirs... Le meilleur reste à venir ! 🏖️🕊️",
    "Des décennies de dévouement et maintenant le temps est tout à toi. Profite chaque seconde ! ⏰💛",
  ],
  comingout: [
    "Être vrai(e) face au monde demande un courage immense. Bravo pour cette authenticité ! 🏳️‍🌈💪",
    "Tu es exactement qui tu es — et c'est parfait. Accueillons cette vérité avec amour et respect ! ❤️‍🔥🌈",
    "La liberté d'être soi-même est la plus grande des victoires. Nous sommes fiers de toi ! 🌈✨",
  ],
  diplome: [
    "Ce diplôme est la preuve tangible de ta ténacité ! Toutes ces heures ont porté leurs fruits. 🎓🏆",
    "Diplômé(e) ! Un titre qui ouvre des portes infinies. Que ta carrière soit à la hauteur de tes ambitions ! 📜⭐",
    "Félicitations pour ce diplôme ! Tu portes désormais un titre que rien ni personne ne peut t'enlever. 🎓💪",
  ],
  prenatal: [
    "Un petit être grandit en toi — quelle merveille ! Profite de chaque instant de cette magie unique. 🤰✨",
    "L'aventure la plus extraordinaire de ta vie commence ! On t'entoure d'amour et d'impatience. 🍼💕",
    "Bientôt tu seras deux ! Que cette grossesse soit douce et cette naissance inoubliable. 👶🌟",
  ],
};

function makeCmd(key, emoji, titre) {
  return {
    name: key,
    execute: async (ctx) => {
      const { sock, jid, msg, antiBan, pushName, args } = ctx;
      const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      const target = mentions[0] ? '@' + mentions[0].split('@')[0] : (args.join(' ') || null);
      await antiBan.safeSend(sock, jid, {
        text: buildMsg(emoji, titre, MSGS[key], pushName, target),
        mentions,
      }, { msgOptions: { quoted: msg } });
    },
  };
}

const naissance    = makeCmd('naissance',    '👶', 'FÉLICITATIONS POUR LA NAISSANCE');
const cremaillere  = makeCmd('cremaillere',  '🏠', 'CRÉMAILLÈRE');
const potdepart    = makeCmd('potdepart',    '🚀', 'POT DE DÉPART');
const soutenance   = makeCmd('soutenance',   '🎓', 'FÉLICITATIONS POUR LA SOUTENANCE');
const permis       = makeCmd('permis',       '🚗', 'FÉLICITATIONS POUR LE PERMIS');
const bac          = makeCmd('bac',          '📜', 'FÉLICITATIONS POUR LE BAC');
const mariage      = makeCmd('mariage',      '💍', 'FÉLICITATIONS POUR LE MARIAGE');
const divorce      = makeCmd('divorce',      '🦋', 'NOUVEAU DÉPART');
const retraite     = makeCmd('retraite',     '🎊', 'BONNE RETRAITE');
const comingout    = makeCmd('comingout',    '🌈', 'BRAVO ET FÉLICITATIONS');
const diplome      = makeCmd('diplome',      '🎓', 'FÉLICITATIONS POUR LE DIPLÔME');
const prenatal     = makeCmd('prenatal',     '🤰', 'HEUREUSE GROSSESSE');

module.exports = { naissance, cremaillere, potdepart, soutenance, permis, bac, mariage, divorce, retraite, comingout, diplome, prenatal };
