/**
 * ZERO TRACE BOT v5.0 - Surnaturel
 * ghost · ouija · crystalball · aura · pastlife · parallel · curse · bless · zodiacsign
 */

function getRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const GHOST_MESSAGES = [
  "👻 _...je... je suis là depuis longtemps... tu le savais ?_",
  "👻 _Ne te retourne pas. Je suis juste derrière toi._",
  "👻 _La pièce est froide parce que... je suis là._",
  "👻 _Cet endroit n'a jamais vraiment été vide._",
  "👻 _...tu entends ça ? Ce n'est pas le vent._",
  "👻 _Il y a des choses ici que les vivants ne devraient pas voir._",
  "👻 _Je ne peux pas partir. Pas encore._",
  "👻 _Quelqu'un a dit mon nom hier... ça m'a réveillé(e)._",
];

const OUIJA_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const OUIJA_RESPONSES = [
  () => {
    const word = Array.from({ length: Math.floor(Math.random() * 4) + 3 }, () => getRandom(OUIJA_LETTERS)).join('');
    return `O... U... I... J... A...\n\nLa planchette se déplace...\n\n_${word}_ — Une entité essaie de communiquer.`;
  },
  () => `La planchette pointe vers *OUI*... puis vers *NON*... puis s'arrête brusquement.`,
  () => `L'indicateur épelle lentement : *V-I-E-N-S*\n\n_Silence. Puis une lumière vacille._`,
  () => `La planchette tourne en cercles, puis épelle : *J-E-S-U-I-S-L-A*`,
  () => `GOODBYE... La planchette fuit vers la sortie. Ne l'utilisez plus ce soir.`,
];

const AURAS = [
  { color: "🔴 Rouge", meaning: "Énergie brute, passion, survie. Tu es en mode combat ou tu traverses une période intense.", chakra: "Racine" },
  { color: "🟠 Orange", meaning: "Créativité débordante, émotions vives, sensualité. Tu es en pleine expression de toi-même.", chakra: "Sacré" },
  { color: "🟡 Jaune", meaning: "Intellect aiguisé, optimisme, confiance en soi. Ton mental est en effervescence.", chakra: "Plexus Solaire" },
  { color: "🟢 Vert", meaning: "Guérison, équilibre, amour inconditionnel. Tu es un guérisseur naturel.", chakra: "Cœur" },
  { color: "🔵 Bleu", meaning: "Communication, vérité, calme profond. Tu sais écouter et exprimer avec sagesse.", chakra: "Gorge" },
  { color: "🟣 Violet", meaning: "Intuition développée, conscience spirituelle élevée. Tu vois ce que d'autres ne voient pas.", chakra: "Troisième Œil" },
  { color: "⚪ Blanc", meaning: "Pureté divine, connexion cosmique. Une protection invisible t'entoure.", chakra: "Couronne" },
  { color: "⚫ Noir", meaning: "Protection, absorbtion des énergies négatives. Tu gardes beaucoup en toi.", chakra: "Tous — Bouclier" },
  { color: "🩷 Rose", meaning: "Amour romantique, douceur, vulnérabilité ouverte. Ton cœur est grand ouvert.", chakra: "Cœur supérieur" },
  { color: "🟤 Or", meaning: "Sagesse divine, illumination, protection cosmique. Un être de lumière t'accompagne.", chakra: "Solaire Divin" },
];

const PAST_LIVES = [
  "🏺 *Égypte Ancienne — 1300 av. J.-C.*\nTu étais prêtre(sse) au temple d'Amon-Râ. Gardien(ne) des secrets sacrés, tu connaissais l'art de la transmutation et la magie des hiéroglyphes.",
  "⚔️ *Feudal Japan — 1200 ap. J.-C.*\nTu étais un(e) samouraï sans maître — un Ronin. Tu errais de ville en ville, portant un code d'honneur que personne d'autre ne comprenait.",
  "🌊 *Viking Norvège — 850 ap. J.-C.*\nTu étais un(e) explorateur(trice) qui a découvert des terres inconnues bien avant les autres. La mer était ta maison.",
  "📚 *Renaissance Italie — 1500 ap. J.-C.*\nTu étais un(e) érudit(e) et artiste. Ami(e) de grands penseurs, tu créais des œuvres qui surpassaient ton époque.",
  "🧙 *Moyen-âge France — 1100 ap. J.-C.*\nTu étais un alchimiste/une alchimiste recherché(e) pour tes connaissances interdites sur la transformation des métaux et des âmes.",
  "🌿 *Amazonie — 600 ap. J.-C.*\nTu étais un(e) chaman(e), le/la pont entre le monde des vivants et celui des esprits. Les plantes te parlaient.",
  "🏛️ *Grèce Antique — 450 av. J.-C.*\nTu étais un(e) philosophe qui débattait avec Socrate. Tes idées sur l'âme et le cosmos étaient en avance sur tout le monde.",
];

const PARALLEL_WORLDS = [
  "🌀 *Dans un univers parallèle...*\nTu as choisi la route de droite ce jour-là. Tu habites maintenant dans une autre ville, une autre vie. Tu ne regrettes rien.",
  "🌀 *Dans un univers parallèle...*\nTu n'as jamais téléchargé cette application. Ta vie est plus lente, moins connectée, mais tu lis davantage.",
  "🌀 *Dans un univers parallèle...*\nTu as dit OUI quand tu as dit non. Ce choix t'a menée vers une aventure qui dépasse tout ce que tu imagines.",
  "🌀 *Dans un univers parallèle...*\nTu es astronaute. Tu regardes la Terre depuis l'ISS en ce moment même et tu penses : _c'est plus petit que je le croyais._",
  "🌀 *Dans un univers parallèle...*\nLa technologie n'existe pas. Tu vis dans un village médiéval. Et ironiquement, tu es plus heureux/heureuse.",
  "🌀 *Dans un univers parallèle...*\nTu es un être de pur énergie, sans corps. Tu communiques par vibrations et tu te demandes comment les humains supportent la pesanteur.",
];

const CURSES = [
  "⛧ *Malédiction des Étoiles Mortes* ⛧\nPendant 24h, chaque fois que tu cherches quelque chose, tu ne trouveras pas ce que tu cherchais... mais quelque chose d'encore mieux.",
  "⛧ *Malédiction du Miroir Brisé* ⛧\nQuoi que tu fasses, tu auras l'impression d'être épié(e). C'est parce que tu l'es. Mais pas par des ennemis.",
  "⛧ *Malédiction du Rire Maudit* ⛧\nTu vas rire au moment le plus inapproprié aujourd'hui. L'univers a décidé que c'était ton tour.",
  "⛧ *Malédiction de l'Oreille Gauche* ⛧\nTu entendras une chanson dans ta tête pendant toute la journée. Elle changera toutes les 3 heures.",
  "⛧ *Malédiction du Café Froid* ⛧\nChaque boisson chaude que tu prépares aujourd'hui refroidira exactement 30 secondes avant que tu la boives.",
];

const BLESSINGS = [
  "✨ *Bénédiction des Ancêtres* ✨\nLes âmes de tes ancêtres te voient. Ils sont fiers de toi. Cette bénédiction ouvre une porte que tu cherchais depuis longtemps.",
  "✨ *Bénédiction du Soleil Levant* ✨\nUne nouvelle énergie t'enveloppe. Quelque chose de nouveau et de positif commence aujourd'hui. Ouvre les yeux.",
  "✨ *Bénédiction des Étoiles* ✨\nL'univers a entendu tes prières silencieuses. Ce que tu attends arrive. Sois prêt(e) à le recevoir.",
  "✨ *Bénédiction du Phénix* ✨\nCe qui était détruit en toi se reconstruit plus fort. Tu n'es pas brisé(e) — tu es en train d'être refondu(e).",
  "✨ *Bénédiction de la Lune Pleine* ✨\nTes intuitions sont exactes. Fais confiance à ce que tu ressens profondément cette semaine.",
];

const CRYSTAL_BALL_ANSWERS = [
  "🔮 La boule de cristal montre... *un sourire inattendu de quelqu'un que tu n'espérais plus.*",
  "🔮 La boule de cristal montre... *une décision difficile qui mènera à quelque chose d'extraordinaire.*",
  "🔮 La boule de cristal montre... *ta photo dans 5 ans — tu as l'air d'avoir trouvé ta voie.*",
  "🔮 La boule de cristal montre... *une réunion avec quelqu'un du passé qui changera tout.*",
  "🔮 La boule de cristal montre... *l'image est trouble. Trop de chemins encore ouverts. Décide.*",
  "🔮 La boule de cristal montre... *un voyage. Pas forcément géographique — un voyage intérieur.*",
  "🔮 La boule de cristal se noircit... *certaines réponses ne doivent pas encore être connues.*",
];

const ZODIAC_SIGNS_BY_DATE = [
  { name: "Capricorne", emoji: "♑", start: [12, 22], end: [1, 19] },
  { name: "Verseau", emoji: "♒", start: [1, 20], end: [2, 18] },
  { name: "Poissons", emoji: "♓", start: [2, 19], end: [3, 20] },
  { name: "Bélier", emoji: "♈", start: [3, 21], end: [4, 19] },
  { name: "Taureau", emoji: "♉", start: [4, 20], end: [5, 20] },
  { name: "Gémeaux", emoji: "♊", start: [5, 21], end: [6, 20] },
  { name: "Cancer", emoji: "♋", start: [6, 21], end: [7, 22] },
  { name: "Lion", emoji: "♌", start: [7, 23], end: [8, 22] },
  { name: "Vierge", emoji: "♍", start: [8, 23], end: [9, 22] },
  { name: "Balance", emoji: "♎", start: [9, 23], end: [10, 22] },
  { name: "Scorpion", emoji: "♏", start: [10, 23], end: [11, 21] },
  { name: "Sagittaire", emoji: "♐", start: [11, 22], end: [12, 21] },
];

// ── Export commandes ─────────────────────────────────────────────────────────

const ghost = {
  name: 'ghost',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    await antiBan.safeSend(sock, jid, {
      text:
        `👻 *CONTACT PARANORMAL*\n\n` +
        `_Les énergies sont instables ce soir..._\n\n` +
        `${getRandom(GHOST_MESSAGES)}\n\n` +
        `_...la connexion s'est coupée._\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const ouija = {
  name: 'ouija',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, args } = ctx;
    const question = args.join(' ') || 'Y a-t-il quelqu\'un ?';
    const response = getRandom(OUIJA_RESPONSES)();
    await antiBan.safeSend(sock, jid, {
      text:
        `🔲 *PLANCHE OUIJA*\n\n` +
        `❓ Question : _"${question}"_\n\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `${response}\n` +
        `━━━━━━━━━━━━━━━━\n\n` +
        `⚠️ _Utilise avec précaution. Certaines portes ne se referment pas facilement._\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const crystalball = {
  name: 'crystalball',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, pushName, args } = ctx;
    const question = args.join(' ') || 'Que me réserve l\'avenir ?';
    await antiBan.safeSend(sock, jid, {
      text:
        `🔮 *BOULE DE CRISTAL*\n` +
        `_${pushName} consulte les mystères..._\n\n` +
        `❓ _"${question}"_\n\n` +
        `✨ Révélation :\n` +
        `${getRandom(CRYSTAL_BALL_ANSWERS)}\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const aura = {
  name: 'aura',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, pushName } = ctx;
    const a = getRandom(AURAS);
    await antiBan.safeSend(sock, jid, {
      text:
        `✨ *LECTURE D'AURA*\n` +
        `_Pour ${pushName}_ 🌈\n\n` +
        `Couleur dominante : *${a.color}*\n\n` +
        `📖 ${a.meaning}\n\n` +
        `🔵 Chakra associé : *${a.chakra}*\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const pastlife = {
  name: 'pastlife',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, pushName } = ctx;
    await antiBan.safeSend(sock, jid, {
      text:
        `⏳ *VIE PASSÉE*\n` +
        `_L'âme de ${pushName} a existé avant..._\n\n` +
        `${getRandom(PAST_LIVES)}\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const parallel = {
  name: 'parallel',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, pushName } = ctx;
    await antiBan.safeSend(sock, jid, {
      text:
        `🌀 *UNIVERS PARALLÈLE*\n` +
        `_${pushName} dans une autre dimension..._\n\n` +
        `${getRandom(PARALLEL_WORLDS)}\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const curse = {
  name: 'curse',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, pushName, args } = ctx;
    const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target = mentions[0] ? '@' + mentions[0].split('@')[0] : pushName;
    const c = getRandom(CURSES);
    await antiBan.safeSend(sock, jid, {
      text:
        `⛧ *MALÉDICTION*\n\n` +
        `_${target} a été maudit(e)..._\n\n` +
        `${c}\n\n` +
        `⚠️ _Pour lever la malédiction : .bless_\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
      mentions,
    }, { msgOptions: { quoted: msg } });
  },
};

const bless = {
  name: 'bless',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, pushName, args } = ctx;
    const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target = mentions[0] ? '@' + mentions[0].split('@')[0] : pushName;
    const b = getRandom(BLESSINGS);
    await antiBan.safeSend(sock, jid, {
      text:
        `✨ *BÉNÉDICTION*\n\n` +
        `_Pour ${target}_\n\n` +
        `${b}\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
      mentions,
    }, { msgOptions: { quoted: msg } });
  },
};

const zodiacsign = {
  name: 'zodiacsign',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, args } = ctx;
    const input = args.join(' ').trim();
    // Detect DD/MM or DD-MM
    const match = input.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
    if (!match) {
      await antiBan.safeSend(sock, jid, {
        text: '♈ *SIGNE DU ZODIAQUE*\n\nEnvoie ta date de naissance :\n*.zodiacsign DD/MM*\nEx : *.zodiacsign 15/03*\n\n> *ZERO TRACE BOT v5.0*',
      }, { msgOptions: { quoted: msg } });
      return;
    }
    const day = parseInt(match[1]);
    const month = parseInt(match[2]);
    let found = null;
    for (const z of ZODIAC_SIGNS_BY_DATE) {
      const [sm, sd] = z.start;
      const [em, ed] = z.end;
      if ((month === sm && day >= sd) || (month === em && day <= ed)) {
        found = z;
        break;
      }
    }
    if (!found) found = ZODIAC_SIGNS_BY_DATE[0]; // Capricorne fallback
    await antiBan.safeSend(sock, jid, {
      text:
        `${found.emoji} *TON SIGNE ZODIACAL*\n\n` +
        `📅 Naissance : ${day}/${month}\n` +
        `⭐ Signe : *${found.name}* ${found.emoji}\n\n` +
        `💡 _Tape .horoscope ${found.name.toLowerCase()} pour ta prévision du jour !_\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

module.exports = { ghost, ouija, crystalball, aura, pastlife, parallel, curse, bless, zodiacsign };
