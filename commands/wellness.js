/**
 * ZERO TRACE BOT v5.0 - Bien-être & Mystic
 * meditation · breathing · affirmation · gratitude · journal · mood · sleep · stretch · yoga · habit
 * tarot · astrology · numerology · dream · oracle
 */

function getRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const MEDITATIONS = [
  { theme: "Pleine Conscience", duration: "5 min", guide: "Ferme les yeux. Inspire profondément par le nez (4s), retiens (4s), expire par la bouche (4s). Répète 5 fois. Concentre-toi uniquement sur ta respiration. Chaque pensée qui arrive, observe-la sans la juger, puis laisse-la partir comme un nuage." },
  { theme: "Body Scan", duration: "10 min", guide: "Allonge-toi confortablement. Commence par tes pieds — sens chaque orteils, la plante, le talon. Remonte lentement vers les chevilles, les mollets, les genoux... Prends conscience de chaque partie de ton corps sans forcer." },
  { theme: "Visualisation", duration: "7 min", guide: "Imagine-toi dans un endroit parfait — une plage, une forêt, une montagne. Visualise les couleurs, les sons, les odeurs. Sens la chaleur du soleil sur ta peau. Tu es en sécurité. Tu es bien. Reste dans cet espace aussi longtemps que tu veux." },
  { theme: "Bienveillance", duration: "8 min", guide: "Commence par toi : 'Que je sois heureux, que je sois en bonne santé, que je sois en paix.' Puis étends ce souhait à tes proches, à tes connaissances, et enfin à tous les êtres du monde." },
];

const YOGA_POSES = [
  { name: "🧘 Posture de l'Enfant (Balasana)", niveau: "Débutant", desc: "À genoux, assois-toi sur tes talons, étire les bras devant toi, front au sol. Respire profondément. Maintiens 1-3 minutes.", bienfait: "Détend le dos, soulage le stress." },
  { name: "🌳 Posture de l'Arbre (Vrikshasana)", niveau: "Débutant", desc: "Debout, pied gauche contre l'intérieur de la cuisse droite. Mains jointes au-dessus de la tête. Équilibre 30 secondes.", bienfait: "Renforce l'équilibre et la concentration." },
  { name: "🐍 Cobra (Bhujangasana)", niveau: "Intermédiaire", desc: "À plat ventre, mains sous les épaules. Soulève la poitrine en inspirant, sans forcer les coudes. Maintiens 20 secondes.", bienfait: "Ouvre la cage thoracique, renforce le dos." },
  { name: "⬇️ Chien Tête en Bas (Adho Mukha)", niveau: "Intermédiaire", desc: "Pieds et mains au sol, hanches vers le haut, corps en triangle inversé. Talons vers le bas, tête entre les bras.", bienfait: "Étire tout le corps, soulage les tensions." },
  { name: "🦁 Lion (Simhasana)", niveau: "Débutant", desc: "Assis sur les talons, inspire profondément, puis expire fort en tirant la langue et en ouvrant grand les yeux.", bienfait: "Libère les tensions du visage et gorge." },
];

const STRETCHES = [
  "🦵 *Étirement ischio-jambiers :* Assis par terre, jambes tendues. Penche-toi vers tes pieds, maintiens 30s.",
  "💪 *Étirement épaules :* Passe un bras devant ta poitrine, tiens-le avec l'autre bras 20-30s. Change côté.",
  "🧠 *Étirement nuque :* Incline doucement la tête à droite, main droite sur la tempe gauche. 20s chaque côté.",
  "🦶 *Mollets :* Debout, mains au mur, une jambe tendue derrière. Talon au sol, maintiens 30s.",
  "🦷 *Flexion avant :* Debout, pieds joints. Penche-toi lentement les bras vers le sol. Maintiens 45s.",
  "🌀 *Rotation thoracique :* Assis, croise les bras sur la poitrine. Tourne lentement à droite, puis à gauche. 10 fois chaque côté.",
];

const HABITS = [
  "🌅 *Habit #1 — Lève-toi 30 min plus tôt*\nCe temps t'appartient entièrement. Médite, lis, planifie ta journée. Ce rituel du matin change tout.",
  "💧 *Habit #2 — Bois 2L d'eau par jour*\nPlace une bouteille de 2L sur ton bureau. Elle doit être vide le soir. Simple, transformateur.",
  "📵 *Habit #3 — Pas d'écran le matin*\nLes 30 premières minutes sans réseaux sociaux. Protège ton énergie mentale du matin.",
  "📓 *Habit #4 — Journaling*\nChaque soir, écris 3 choses positives de ta journée. Réentraîne ton cerveau à chercher le bon.",
  "🚶 *Habit #5 — 10 min de marche*\nPas besoin de sport intense. 10 min dehors chaque jour réduit l'anxiété de 30%.",
  "📚 *Habit #6 — Lis 10 pages/jour*\n10 pages × 365 jours = ~12 livres par an. La connaissance composée change une vie.",
  "🎯 *Habit #7 — Une tâche prioritaire*\nChaque matin, identifie LA tâche la plus importante. Fais-la en premier. Tout le reste est secondaire.",
];

const AFFIRMATIONS = [
  "✨ *Je suis capable de surmonter tous les obstacles sur mon chemin.*",
  "💪 *Ma valeur n'est pas définie par mes erreurs, mais par ma capacité à en apprendre.*",
  "🌟 *Je mérite le succès, l'amour et la paix. Je les accueille pleinement.*",
  "🧠 *Mon esprit est fort. Mes pensées créent ma réalité.*",
  "🔥 *Chaque jour, je deviens une meilleure version de moi-même.*",
  "🌈 *Je suis assez. Je fais assez. J'ai assez.*",
  "⚡ *Mes rêves méritent que je me batte pour eux.*",
  "🌙 *Même dans l'obscurité, je porte ma propre lumière.*",
  "🚀 *Je transforme chaque défi en opportunité de grandir.*",
  "❤️ *Je m'aime et je prends soin de moi chaque jour.*",
];

const MOODS = {
  bien: { emoji: "😊", msg: "Content de l'apprendre ! Garde cette énergie positive. Tu rayonnes aujourd'hui ☀️" },
  super: { emoji: "🤩", msg: "INCROYABLE ! Cette énergie est contagieuse ! Profite de chaque seconde 🎉" },
  triste: { emoji: "😔", msg: "C'est OK d'avoir des moments difficiles. Tu n'es pas seul(e). Prends soin de toi 💙" },
  fatigué: { emoji: "😴", msg: "Ton corps te parle. Accorde-toi du repos, tu le mérites amplement 🌙" },
  stressé: { emoji: "😰", msg: "Inspire... expire... Tout passe. Ce moment difficile n'est que temporaire. Tu vas t'en sortir 💪" },
  motivé: { emoji: "⚡", msg: "Cette énergie est PUISSANTE ! Canalise-la, le monde est à toi aujourd'hui 🚀" },
  perdu: { emoji: "🌀", msg: "Parfois se perdre est le début de se trouver. Fais confiance au processus 🌟" },
  en_colere: { emoji: "😤", msg: "Ta colère est valide. Prends un moment, respire, puis décide comment y répondre avec sagesse 🧘" },
};

const SLEEP_TIPS = [
  "🌙 *Règle d'or #1 :* Couche-toi et lève-toi à la même heure chaque jour. Ton corps adore la régularité.",
  "📵 *Règle d'or #2 :* Pas d'écran 1h avant de dormir. La lumière bleue perturbe la mélatonine.",
  "🌡️ *Règle d'or #3 :* La chambre doit être fraîche (18-20°C). Ton cerveau dort mieux dans le frais.",
  "☕ *Règle d'or #4 :* Pas de caféine après 14h. Elle reste dans ton organisme 6-8 heures.",
  "📓 *Règle d'or #5 :* Écris tes préoccupations avant de dormir. Vidange ton esprit sur papier.",
  "🧘 *Règle d'or #6 :* 4-7-8 : Inspire 4s, retiens 7s, expire 8s. Technique anti-insomnie redoutable.",
  "🛏️ *Règle d'or #7 :* Le lit = sommeil uniquement. Pas de travail, pas de films. Conditionne ton cerveau.",
];

const GRATITUDE_PROMPTS = [
  "🙏 *Exercice Gratitude :*\n\nPrends 2 minutes. Note ou pense à :\n\n1️⃣ Une personne pour qui tu es reconnaissant(e)\n2️⃣ Une chose simple qui te rend heureux/heureuse\n3️⃣ Un moment de bonheur d'aujourd'hui\n\n_La gratitude transforme ce que tu as en suffisance._ ✨",
  "🌸 *Lettre de Gratitude :*\n\nPense à quelqu'un qui a changé ta vie positivement. Imagine-lui écrire une lettre.\nDis-lui ce que sa présence t'a apporté.\nComment ta vie serait-elle différente sans lui/elle ?",
  "🌟 *Gratitude du Corps :*\n\nTon corps travaille pour toi chaque seconde.\nRemercie tes yeux qui te permettent de lire ceci.\nRemercie tes mains, tes jambes, ton cœur qui bat.\n_Prends soin de ce temple extraordinaire._",
];

const JOURNAL_PROMPTS = [
  "📝 *Prompt Journal du jour :*\n\n_\"Si je pouvais changer une chose dans ma vie cette semaine, ce serait...\"_\n\nÉcris librement pendant 5 minutes. Sans filtre, sans jugement.",
  "📝 *Prompt Journal du jour :*\n\n_\"Ma plus grande force est... et voici comment je peux mieux l'utiliser :\"_",
  "📝 *Prompt Journal du jour :*\n\n_\"Dans 5 ans, quand je regarderai cette période de ma vie, je voudrai m'en souvenir comme...\"_",
  "📝 *Prompt Journal du jour :*\n\n_\"Ce que je laisserais partir si je pouvais, c'est...\"_",
  "📝 *Prompt Journal du jour :*\n\n_\"Je suis fier(ère) de moi parce que récemment, j'ai...\"_",
];

// ── MYSTIC ───────────────────────────────────────────────────────────────────

const TAROT_CARDS = [
  { name: "Le Fou", emoji: "🃏", signif: "Nouveau départ, liberté, aventure", ombre: "Imprudence, manque de direction" },
  { name: "Le Magicien", emoji: "🎩", signif: "Volonté, pouvoir, créativité", ombre: "Manipulation, tromperie" },
  { name: "La Papesse", emoji: "📿", signif: "Sagesse intérieure, intuition, mystère", ombre: "Secrets gardés, repli sur soi" },
  { name: "L'Impératrice", emoji: "👑", signif: "Fertilité, abondance, nature", ombre: "Dépendance affective, superficialité" },
  { name: "L'Empereur", emoji: "⚖️", signif: "Autorité, structure, stabilité", ombre: "Rigidité, besoin de contrôle" },
  { name: "La Roue de Fortune", emoji: "🎡", signif: "Changement, destin, opportunités", ombre: "Résistance au changement" },
  { name: "La Lune", emoji: "🌙", signif: "Illusion, rêves, inconscient", ombre: "Peurs, confusion, mensonge à soi" },
  { name: "Le Soleil", emoji: "☀️", signif: "Joie, vitalité, succès", ombre: "Arrogance, vanité excessive" },
  { name: "Le Jugement", emoji: "📯", signif: "Renouveau, éveil, second souffle", ombre: "Culpabilité, auto-critique excessive" },
  { name: "Le Monde", emoji: "🌍", signif: "Accomplissement, intégration, fin d'un cycle", ombre: "Stagnation, incomplétion" },
  { name: "L'Étoile", emoji: "⭐", signif: "Espoir, sérénité, inspiration divine", ombre: "Désillusion, idéalisme excessif" },
  { name: "La Tour", emoji: "⚡", signif: "Révélation soudaine, effondrement nécessaire", ombre: "Catastrophe évitable, déni" },
  { name: "La Force", emoji: "🦁", signif: "Courage, maîtrise de soi, compassion", ombre: "Brutalité, faiblesse intérieure" },
  { name: "Le Hermite", emoji: "🕯️", signif: "Introspection, sagesse, solitude choisie", ombre: "Isolement, repli excessif" },
  { name: "Le Chariot", emoji: "🏆", signif: "Victoire, volonté, maîtrise", ombre: "Agression, manque de contrôle" },
];

const ORACLE_MESSAGES = [
  "🔮 *L'Oracle parle :*\n\n_Ce que tu cherches à l'extérieur existe déjà en toi. Tourne ton regard vers l'intérieur._",
  "🔮 *L'Oracle parle :*\n\n_Une porte se ferme, mais trois autres s'ouvrent. Tu ne les vois pas encore — mais elles sont là._",
  "🔮 *L'Oracle parle :*\n\n_La personne que tu dois libérer, c'est toi-même. Arrête de te punir pour le passé._",
  "🔮 *L'Oracle parle :*\n\n_L'univers conspire en ta faveur, même quand tout semble aller contre toi._",
  "🔮 *L'Oracle parle :*\n\n_Ton intuition t'a déjà montré la réponse. Tu as juste peur de l'entendre._",
  "🔮 *L'Oracle parle :*\n\n_Ce qui te résiste, t'enseigne. Regarde cette friction comme un cadeau déguisé._",
  "🔮 *L'Oracle parle :*\n\n_La période de transition que tu traverses est nécessaire. Tu en sortiras transformé(e)._",
];

const DREAM_MEANINGS = {
  voler: "✈️ *Voler* symbolise le désir de liberté et de dépassement des limites. Tu cherches à t'élever au-dessus des contraintes de ta vie.",
  tomber: "⬇️ *Tomber* représente souvent une perte de contrôle ou une anxiété face à l'échec. Examine ce qui te fait peur dans ta vie actuelle.",
  eau: "🌊 *L'eau* symbolise les émotions. Eau calme = paix intérieure. Eau agitée = turbulences émotionnelles en cours.",
  mort: "💀 *Rêver de mort* représente presque toujours une fin et un nouveau commencement — pas une mort réelle. Un chapitre se clôt.",
  maison: "🏠 *La maison* représente ton moi intérieur. Les différentes pièces symbolisent différents aspects de ta personnalité.",
  serpent: "🐍 *Le serpent* est ambivalent : transformation et guérison, mais aussi menace cachée ou trahison à venir.",
  feu: "🔥 *Le feu* symbolise la passion, la transformation, mais aussi la colère ou destruction d'anciennes structures.",
  dents: "🦷 *Perdre des dents* est l'un des rêves les plus fréquents : peur du jugement des autres, anxiété sociale ou perte de pouvoir.",
};

const ASTRO = {
  bélier:    { periode: "21 mars - 19 avril", element: "Feu", planete: "Mars", trait: "Courageux, pionnier, impulsif" },
  taureau:   { periode: "20 avril - 20 mai", element: "Terre", planete: "Vénus", trait: "Patient, fidèle, sensuel" },
  gémeaux:   { periode: "21 mai - 20 juin", element: "Air", planete: "Mercure", trait: "Curieux, adaptable, communicatif" },
  cancer:    { periode: "21 juin - 22 juillet", element: "Eau", planete: "Lune", trait: "Intuitif, protecteur, émotionnel" },
  lion:      { periode: "23 juillet - 22 août", element: "Feu", planete: "Soleil", trait: "Charismatique, généreux, fier" },
  vierge:    { periode: "23 août - 22 sept", element: "Terre", planete: "Mercure", trait: "Analytique, serviable, perfectionniste" },
  balance:   { periode: "23 sept - 22 oct", element: "Air", planete: "Vénus", trait: "Diplomate, harmonieux, indécis" },
  scorpion:  { periode: "23 oct - 21 nov", element: "Eau", planete: "Pluton", trait: "Intense, mystérieux, perspicace" },
  sagittaire:{ periode: "22 nov - 21 déc", element: "Feu", planete: "Jupiter", trait: "Optimiste, aventurier, philosophe" },
  capricorne:{ periode: "22 déc - 19 jan", element: "Terre", planete: "Saturne", trait: "Ambitieux, discipliné, pratique" },
  verseau:   { periode: "20 jan - 18 fév", element: "Air", planete: "Uranus", trait: "Original, humaniste, indépendant" },
  poissons:  { periode: "19 fév - 20 mars", element: "Eau", planete: "Neptune", trait: "Empathique, intuitif, rêveur" },
};

// ── Export commandes ─────────────────────────────────────────────────────────

const meditation = {
  name: 'meditation',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    const m = getRandom(MEDITATIONS);
    await antiBan.safeSend(sock, jid, {
      text:
        `🧘 *MÉDITATION GUIDÉE*\n\n` +
        `🌿 Thème : *${m.theme}*\n` +
        `⏱️ Durée : ${m.duration}\n\n` +
        `📖 *Guide :*\n${m.guide}\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const breathing = {
  name: 'breathing',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, args } = ctx;
    const technique = args[0]?.toLowerCase() || 'box';
    const TECHNIQUES = {
      box: "📦 *Box Breathing (4-4-4-4)*\nInspire 4s → Retiens 4s → Expire 4s → Pause 4s\nRépète 4-6 fois. Idéal contre le stress.",
      '478': "🌙 *4-7-8 (Anti-insomnie)*\nInspire 4s → Retiens 7s → Expire 8s\nFait 4 cycles. Aide à s'endormir rapidement.",
      cohérence: "💙 *Cohérence Cardiaque*\nInspire 5s → Expire 5s\nFais pendant 5 minutes, 3 fois par jour. Équilibre le système nerveux.",
      calme: "🌊 *Respiration Apaisante*\nInspire 4s par le nez → Expire 6s par la bouche\nL'expiration plus longue active le nerf vague."
    };
    const result = TECHNIQUES[technique] || TECHNIQUES['box'];
    await antiBan.safeSend(sock, jid, {
      text:
        `🌬️ *EXERCICE DE RESPIRATION*\n\n` +
        `${result}\n\n` +
        `💡 _Autres : .breathing box | 478 | cohérence | calme_\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const affirmation = {
  name: 'affirmation',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, pushName } = ctx;
    await antiBan.safeSend(sock, jid, {
      text:
        `💫 *AFFIRMATION DU JOUR*\n` +
        `_Pour ${pushName}_ ✨\n\n` +
        `${getRandom(AFFIRMATIONS)}\n\n` +
        `_Répète cette phrase 3 fois, à voix haute si possible._\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const gratitude = {
  name: 'gratitude',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    await antiBan.safeSend(sock, jid, {
      text: `${getRandom(GRATITUDE_PROMPTS)}\n\n> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const journal = {
  name: 'journal',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    await antiBan.safeSend(sock, jid, {
      text:
        `📔 *JOURNAL — ${today.toUpperCase()}*\n\n` +
        `${getRandom(JOURNAL_PROMPTS)}\n\n` +
        `_Prends un stylo ou tape directement ici._ ✍️\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const mood = {
  name: 'mood',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, args, pushName } = ctx;
    const input = args.join(' ').toLowerCase().replace(/[éè]/g, 'e').replace(/[ô]/g, 'o');
    const key = Object.keys(MOODS).find(k => input.includes(k));
    const response = MOODS[key] || { emoji: "💭", msg: "Peu importe ton humeur, tu es ici et tu avances. C'est ce qui compte 🌟" };
    await antiBan.safeSend(sock, jid, {
      text:
        `${response.emoji} *MOOD CHECK*\n` +
        `_${pushName}_ :\n\n` +
        `${response.msg}\n\n` +
        `💡 _Partage ton humeur : .mood bien/triste/stressé/motivé..._\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const sleep = {
  name: 'sleep',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    await antiBan.safeSend(sock, jid, {
      text:
        `🌙 *CONSEILS SOMMEIL*\n\n` +
        getRandom(SLEEP_TIPS) +
        `\n\n📋 _7 règles d'or pour un sommeil parfait disponibles._\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const stretch = {
  name: 'stretch',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    const s = STRETCHES.slice().sort(() => Math.random() - 0.5).slice(0, 3);
    await antiBan.safeSend(sock, jid, {
      text:
        `🤸 *ÉTIREMENTS DU JOUR*\n\n` +
        s.join('\n\n') +
        `\n\n_Maintiens chaque position 20-30 secondes. Respire lentement._\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const yoga = {
  name: 'yoga',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    const p = getRandom(YOGA_POSES);
    await antiBan.safeSend(sock, jid, {
      text:
        `🧘 *POSTURE DE YOGA*\n\n` +
        `${p.name}\n` +
        `📊 Niveau : ${p.niveau}\n\n` +
        `📋 *Comment faire :*\n${p.desc}\n\n` +
        `✨ *Bienfaits :* ${p.bienfait}\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const habit = {
  name: 'habit',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    await antiBan.safeSend(sock, jid, {
      text:
        `⚡ *HABIT DU JOUR*\n\n` +
        `${getRandom(HABITS)}\n\n` +
        `_Commence aujourd'hui. Juste aujourd'hui._ 🎯\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

// ── MYSTIC ───────────────────────────────────────────────────────────────────

const tarot = {
  name: 'tarot',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, pushName, args } = ctx;
    const spread = args[0]?.toLowerCase();
    if (spread === '3' || spread === 'tirage') {
      const cards = TAROT_CARDS.slice().sort(() => Math.random() - 0.5).slice(0, 3);
      const labels = ['PASSÉ', 'PRÉSENT', 'FUTUR'];
      await antiBan.safeSend(sock, jid, {
        text:
          `🃏 *TIRAGE TAROT — 3 CARTES*\n` +
          `_Pour ${pushName}_ 🔮\n\n` +
          cards.map((c, i) =>
            `*${labels[i]} :* ${c.emoji} ${c.name}\n└ ${c.signif}`
          ).join('\n\n') +
          `\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
      return;
    }
    const card = getRandom(TAROT_CARDS);
    await antiBan.safeSend(sock, jid, {
      text:
        `🃏 *TAROT DU JOUR*\n` +
        `_Pour ${pushName}_ 🌙\n\n` +
        `${card.emoji} *${card.name}*\n\n` +
        `✨ Signification : ${card.signif}\n` +
        `🌑 Ombre : ${card.ombre}\n\n` +
        `💡 _Tirage 3 cartes : .tarot 3_\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const astrology = {
  name: 'astrology',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, args } = ctx;
    const signe = args.join(' ').toLowerCase().trim();
    const info = ASTRO[signe];
    if (!info) {
      const list = Object.keys(ASTRO).join(' · ');
      await antiBan.safeSend(sock, jid, {
        text: `♈ *ASTROLOGIE*\n\nUtilise : *.astrology [signe]*\n\n📋 Signes disponibles :\n${list}\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
      return;
    }
    await antiBan.safeSend(sock, jid, {
      text:
        `🌟 *ASTROLOGIE — ${signe.toUpperCase()}*\n\n` +
        `📅 Période : ${info.periode}\n` +
        `🌊 Élément : ${info.element}\n` +
        `🪐 Planète : ${info.planete}\n` +
        `💬 Traits : ${info.trait}\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const numerology = {
  name: 'numerology',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, args, pushName } = ctx;
    const input = args.join(' ') || pushName;
    let sum = 0;
    for (const ch of input.toLowerCase()) {
      if (ch >= 'a' && ch <= 'z') sum += ch.charCodeAt(0) - 96;
      else if (ch >= '0' && ch <= '9') sum += parseInt(ch);
    }
    while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
      sum = String(sum).split('').reduce((a, d) => a + parseInt(d), 0);
    }
    const MEANINGS = {
      1: "🥇 Leadership, originalité, indépendance. Tu es né(e) pour guider.",
      2: "🤝 Coopération, sensibilité, diplomatie. Tu excelles dans les partenariats.",
      3: "🎨 Créativité, expression, joie de vivre. L'art et la communication sont tes armes.",
      4: "🏗️ Stabilité, travail acharné, fiabilité. Tu bâtis des fondations solides.",
      5: "🌍 Liberté, aventure, adaptabilité. Le changement est ton moteur.",
      6: "💝 Amour, responsabilité, soin des autres. Tu es le pilier de ta communauté.",
      7: "🔮 Sagesse, analyse, spiritualité. Tu cherches la vérité au-delà des apparences.",
      8: "💰 Ambition, pouvoir, réussite matérielle. Tu es fait(e) pour les grandes réalisations.",
      9: "🌈 Compassion, humanisme, idéalisme. Tu viens pour servir les autres.",
      11: "⚡ Nombre Maître — Intuition divine, inspiration et illumination.",
      22: "🏛️ Nombre Maître — Le Bâtisseur. Capacité de concrétiser les plus grands rêves.",
      33: "☯️ Nombre Maître — Le Maître Enseignant. Amour universel et dévotion.",
    };
    await antiBan.safeSend(sock, jid, {
      text:
        `🔢 *NUMÉROLOGIE*\n\n` +
        `📝 Analyse de : *${input}*\n\n` +
        `🔮 Ton nombre vibratoire : *${sum}*\n\n` +
        `${MEANINGS[sum] || 'Vibration unique — chaque nombre a sa magie.'}\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const dream = {
  name: 'dream',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, args } = ctx;
    const keyword = args[0]?.toLowerCase();
    const meaning = keyword ? (DREAM_MEANINGS[keyword] || null) : null;
    if (meaning) {
      await antiBan.safeSend(sock, jid, {
        text: `💭 *INTERPRÉTATION DE RÊVE*\n\n${meaning}\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    } else {
      const keys = Object.keys(DREAM_MEANINGS).join(' · ');
      await antiBan.safeSend(sock, jid, {
        text:
          `💭 *ANALYSE DE RÊVES*\n\n` +
          `Partage un élément de ton rêve :\n*.dream [mot-clé]*\n\n` +
          `📋 Disponibles : ${keys}\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};

const oracle = {
  name: 'oracle',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, pushName } = ctx;
    await antiBan.safeSend(sock, jid, {
      text:
        `🔮 *L'ORACLE*\n` +
        `_${pushName} consulte les forces mystiques..._\n\n` +
        `${getRandom(ORACLE_MESSAGES)}\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

module.exports = { meditation, breathing, affirmation, gratitude, journal, mood, sleep, stretch, yoga, habit, tarot, astrology, numerology, dream, oracle };
