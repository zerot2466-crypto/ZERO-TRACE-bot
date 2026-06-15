/**
 * ZERO TRACE BOT v5.0 - Jeu de Rôle
 * class · spellbook · cast · guild · tavern · drink · spy · mafia · origami
 */

const CLASSES = [
  { name: "⚔️ Guerrier", desc: "Maître du combat au corps à corps", hp: 120, mp: 30, stats: "ATK:90 DEF:85 VIT:60", passive: "Rage Berserker — +20% ATK sous 30% HP" },
  { name: "🔮 Mage", desc: "Manipulateur des forces arcanes", hp: 70, mp: 120, stats: "ATK:95 DEF:40 VIT:70", passive: "Catalyseur — Sorts amplifiés après 3 tours" },
  { name: "🗡️ Assassin", desc: "Ombre silencieuse, mort certaine", hp: 85, mp: 60, stats: "ATK:95 DEF:45 VIT:99", passive: "Frappe dans l'Ombre — Premier coup x2" },
  { name: "🛡️ Paladin", desc: "Gardien de la lumière divine", hp: 130, mp: 80, stats: "ATK:75 DEF:95 VIT:55", passive: "Aura Sacrée — Protège les alliés proches" },
  { name: "🏹 Archer", desc: "Précision mortelle à longue distance", hp: 90, mp: 50, stats: "ATK:88 DEF:50 VIT:90", passive: "Œil d'Aigle — Critique augmenté de 35%" },
  { name: "💀 Nécromant", desc: "Commande les morts et les âmes", hp: 80, mp: 110, stats: "ATK:85 DEF:55 VIT:65", passive: "Drain de Vie — Soigne 20% des dégâts infligés" },
  { name: "🌿 Druide", desc: "Un avec la nature et ses forces", hp: 100, mp: 100, stats: "ATK:70 DEF:75 VIT:80", passive: "Régénération — Récupère 5 HP/tour" },
  { name: "⚡ Invocateur", desc: "Fait appel à des entités puissantes", hp: 75, mp: 130, stats: "ATK:80 DEF:60 VIT:72", passive: "Pacte Démoniaque — Invoque un familier au combat" },
];

const SPELLS = [
  { name: "🌊 Vague de Foudre", element: "⚡ Foudre", cost: 25, dmg: "85-110", effect: "Paralyse la cible (30%)" },
  { name: "🔥 Brasier Infernal", element: "🔥 Feu", cost: 35, dmg: "110-140", effect: "Brûlure : -10 HP/tour pendant 3 tours" },
  { name: "❄️ Tempête Glaciale", element: "❄️ Glace", cost: 30, dmg: "90-120", effect: "Ralentit la cible de 40%" },
  { name: "💜 Vortex du Néant", element: "🌀 Ténèbres", cost: 45, dmg: "130-160", effect: "Ignore 50% de la défense" },
  { name: "☀️ Rayon Solaire", element: "☀️ Lumière", cost: 40, dmg: "100-130", effect: "Aveugle la cible (2 tours)" },
  { name: "🌿 Racines Mortelles", element: "🌿 Nature", cost: 20, dmg: "60-90", effect: "Immobilise la cible (2 tours)" },
  { name: "💀 Malédiction du Roi", element: "💀 Nécromancie", cost: 50, dmg: "140-180", effect: "Réduit PV max de 30%" },
  { name: "⚗️ Explosion Chimique", element: "☢️ Arcane", cost: 35, dmg: "100-150", effect: "AoE — Touche tous les ennemis" },
];

const GUILDS = [
  { name: "🐺 Meute de l'Ombre", type: "Assassins / Espions", rang: "S", repute: "████████░░ 82%", bonus: "+15% dégâts furtifs" },
  { name: "🐉 Ordre du Dragon Rouge", type: "Guerriers d'élite", rang: "S+", repute: "██████████ 99%", bonus: "+20% résistance aux dégâts" },
  { name: "📚 Académie Arcane", type: "Mages & Chercheurs", rang: "A", repute: "████████░░ 78%", bonus: "Sorts coûtent 10% de mana en moins" },
  { name: "🌿 Cercle de la Forêt", type: "Druides & Rangers", rang: "A", repute: "███████░░░ 71%", bonus: "+25 HP/tour en territoire naturel" },
  { name: "⚒️ Forge du Tonnerre", type: "Artisans & Forgerons", rang: "B+", repute: "██████░░░░ 65%", bonus: "Équipements craft avec +10% stats" },
  { name: "⚖️ Justice Éternelle", type: "Paladins & Inquisiteurs", rang: "A+", repute: "█████████░ 90%", bonus: "Immunité aux malédictions" },
];

const TAVERN_EVENTS = [
  "Un barde chante une ballade épique sur tes aventures. 🎵 Tu te sens *inspiré* ! (+10 XP)",
  "Un inconnu encapuchonné te glisse une carte. _'Si tu veux de vraies récompenses... retrouve-moi à minuit.'_ 🗺️",
  "Le tavernier t'offre une tournée ! 🍺 *La soirée commence bien.*",
  "Une bagarre éclate ! Deux marchands se disputent un parchemin. Interviens-tu ?  ⚔️",
  "Une magicienne lit ton avenir dans une boule de cristal. _'Un grand danger approche... et une grande richesse aussi.'_ 🔮",
  "Un vieux guerrier t'enseigne une technique secrète. Tu gagnes *Frappe Ancestrale* ! 📜",
  "Le groupe de musiciens joue. Tout le monde danse. Tu rencontres une figure mystérieuse. 🕺",
];

const DRINKS = [
  { name: "🍺 Bière des Nains", effect: "+15 Force temporaire", duration: "30 min", taste: "Amère et forte, sent la forge" },
  { name: "🍷 Vin Elfe", effect: "+20 Magie, -5 Force", duration: "1 heure", taste: "Fruité et lumineux, goût de lune" },
  { name: "☕ Café du Sorcier", effect: "+30 Intelligence, Sans sommeil 8h", duration: "8 heures", taste: "Noir comme les ténèbres" },
  { name: "🥤 Potion Vermeil", effect: "+50 HP instantanés", duration: "Immédiat", taste: "Sucré et métallique, goût de sang" },
  { name: "🍵 Thé de Dragon", effect: "+25 Vitesse, immunité au froid", duration: "2 heures", taste: "Épicé et brûlant, souffle de feu" },
  { name: "💧 Eau de Source Sacrée", effect: "Guérit toutes les malédictions", duration: "Permanent", taste: "Pure et douce comme la grâce" },
  { name: "🫧 Bulles de Chaos", effect: "Effet aléatoire — peut être bon ou catastrophique", duration: "Inconnue", taste: "Change à chaque gorgée" },
];

const SPY_MISSIONS = [
  "🕵️ *Mission : Opération Fantôme*\nInfiltre la base ennemie et récupère les plans secrets sans te faire repérer. Ton cover : vendeur de tapis.",
  "🕵️ *Mission : Double Jeu*\nTu dois te rapprocher de la cible, gagner sa confiance... et trahir ton propre camp pour avoir accès aux serveurs.",
  "🕵️ *Mission : Extraction*\nUn agent est compromis. Tu as 6 heures pour le sortir de la ville avant que les ennemis ferment les frontières.",
  "🕵️ *Mission : Le Traître*\nQuelqu'un dans ton équipe travaille pour l'ennemi. Identifie-le avant qu'il ne sabote l'opération.",
  "🕵️ *Mission : Silence Radio*\nToutes les communications sont coupées. Tu dois atteindre le point de rendez-vous en 12h en utilisant uniquement des codes visuels.",
];

const MAFIA_ROLES = [
  { role: "🔫 Parrain", faction: "Mafia", desc: "Le boss. Donne les ordres, élimine les traîtres. Protégé la nuit.", pouvoir: "Peut tuer chaque nuit sans être détecté." },
  { role: "🔍 Détective", faction: "Ville", desc: "Enquête sur les suspects chaque nuit.", pouvoir: "Peut révéler l'identité d'un joueur par nuit." },
  { role: "💊 Médecin", faction: "Ville", desc: "Protège un joueur chaque nuit.", pouvoir: "Sauve une cible d'une élimination nocturne." },
  { role: "🎭 Imposteur", faction: "Mafia", desc: "Se mêle à la ville en faisant semblant d'être civil.", pouvoir: "Ses votes comptent double lors des lynchages." },
  { role: "👁️ Voyant", faction: "Ville", desc: "Perçoit les auras mauvaises.", pouvoir: "Sait si un joueur est de la Mafia ou non." },
  { role: "💣 Kamikaze", faction: "Indépendant", desc: "Veut être éliminé en dernier lynchage.", pouvoir: "Emporte avec lui le dernier à avoir voté contre lui." },
  { role: "🤝 Avocat", faction: "Mafia", desc: "Protège juridiquement le Parrain.", pouvoir: "Peut faire annuler un vote de lynchage par nuit." },
];

const ORIGAMI = [
  {
    figure: "🦢 Grue en Origami",
    difficulte: "Intermédiaire",
    steps: [
      "1️⃣ Prends une feuille carrée (15x15cm recommandé)",
      "2️⃣ Plie en diagonale dans les deux sens, puis déplie",
      "3️⃣ Plie en deux verticalement et horizontalement, puis déplie",
      "4️⃣ Amène les coins vers le centre pour former un carré",
      "5️⃣ Plie les côtés vers la ligne centrale des deux côtés",
      "6️⃣ Forme les ailes en tirant doucement vers le haut",
      "7️⃣ Affine la tête et la queue selon tes préférences",
    ]
  },
  {
    figure: "⭐ Étoile en Origami",
    difficulte: "Facile",
    steps: [
      "1️⃣ Prends 5 bandes de papier de 30x2cm",
      "2️⃣ Fais un nœud simple avec une bande, aplatit en pentagone",
      "3️⃣ Enroule la bande autour du pentagone en suivant les bords",
      "4️⃣ Tuck l'extrémité dans le pli final",
      "5️⃣ Répète avec les 4 autres bandes autour du noyau",
      "6️⃣ Pince légèrement les 5 côtés pour faire saillir les pointes",
    ]
  },
  {
    figure: "🐸 Grenouille Sauteuse",
    difficulte: "Facile",
    steps: [
      "1️⃣ Feuille carrée posée face vers le bas",
      "2️⃣ Plie en deux verticalement",
      "3️⃣ Plie le coin supérieur droit vers le bord gauche (triangle)",
      "4️⃣ Plie le coin supérieur gauche vers le bord droit",
      "5️⃣ Plie le bas vers la base des triangles",
      "6️⃣ Plie les coins latéraux du bas vers le centre",
      "7️⃣ Retourne et tire la queue vers le bas pour la faire sauter !",
    ]
  },
];

function getRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ── Export commandes ─────────────────────────────────────────────────────────

const classCmd = {
  name: 'class',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, pushName } = ctx;
    const c = getRandom(CLASSES);
    await antiBan.safeSend(sock, jid, {
      text:
        `⚔️ *CLASSE ATTRIBUÉE*\n` +
        `_Pour ${pushName}_\n\n` +
        `${c.name}\n` +
        `📖 ${c.desc}\n\n` +
        `❤️ HP : ${c.hp}  |  💧 MP : ${c.mp}\n` +
        `📊 Stats : ${c.stats}\n\n` +
        `✨ *Passif :* ${c.passive}\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const spellbook = {
  name: 'spellbook',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, pushName } = ctx;
    const spells = [getRandom(SPELLS), getRandom(SPELLS), getRandom(SPELLS)];
    const unique = [...new Map(spells.map(s => [s.name, s])).values()].slice(0, 3);
    await antiBan.safeSend(sock, jid, {
      text:
        `📖 *GRIMOIRE DE ${pushName.toUpperCase()}*\n\n` +
        unique.map((s, i) =>
          `*Sort ${i + 1} :* ${s.name}\n` +
          `├ Élément : ${s.element}\n` +
          `├ Coût MP : ${s.cost}\n` +
          `├ Dégâts : ${s.dmg}\n` +
          `└ Effet : ${s.effect}`
        ).join('\n\n') +
        `\n\n> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const cast = {
  name: 'cast',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, args, pushName } = ctx;
    const spellName = args.join(' ').toLowerCase();
    const s = SPELLS.find(sp => sp.name.toLowerCase().includes(spellName)) || getRandom(SPELLS);
    const dmg = Math.floor(Math.random() * 50) + parseInt(s.dmg.split('-')[0]);
    const crit = Math.random() < 0.2;
    const finalDmg = crit ? Math.floor(dmg * 1.5) : dmg;
    await antiBan.safeSend(sock, jid, {
      text:
        `✨ *INCANTATION*\n\n` +
        `🧙 *${pushName}* lance *${s.name}* !\n\n` +
        `${s.element} — Coût : ${s.cost} MP\n\n` +
        `💥 Dégâts infligés : *${finalDmg}*${crit ? ' 🔥 *CRITIQUE !*' : ''}\n` +
        `⚡ Effet : ${s.effect}\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const guild = {
  name: 'guild',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, pushName } = ctx;
    const g = getRandom(GUILDS);
    await antiBan.safeSend(sock, jid, {
      text:
        `🏰 *GUILDE ASSIGNÉE*\n` +
        `_${pushName} a été recruté(e) par..._\n\n` +
        `${g.name}\n` +
        `📋 Type : ${g.type}\n` +
        `🏅 Rang : ${g.rang}\n` +
        `📈 Réputation : ${g.repute}\n` +
        `✨ Bonus : ${g.bonus}\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const tavern = {
  name: 'tavern',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, pushName } = ctx;
    const event = getRandom(TAVERN_EVENTS);
    await antiBan.safeSend(sock, jid, {
      text:
        `🍺 *LA TAVERNE DU BOUT DU MONDE*\n\n` +
        `_${pushName} pousse la porte de la taverne..._\n\n` +
        `${event}\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const drink = {
  name: 'drink',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, pushName } = ctx;
    const d = getRandom(DRINKS);
    await antiBan.safeSend(sock, jid, {
      text:
        `🍻 *${pushName} commande une boisson...*\n\n` +
        `${d.name}\n\n` +
        `✨ Effet : ${d.effect}\n` +
        `⏱️ Durée : ${d.duration}\n` +
        `👅 Goût : _${d.taste}_\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const spy = {
  name: 'spy',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, pushName } = ctx;
    const mission = getRandom(SPY_MISSIONS);
    const gadgets = ['🔭 Lunettes à vision nocturne', '💻 Laptop de hacking', '🧲 Grappin magnétique', '💊 Pilule d\'amnésie', '📡 Micro longue portée'];
    const g1 = getRandom(gadgets), g2 = getRandom(gadgets.filter(g => g !== g1));
    await antiBan.safeSend(sock, jid, {
      text:
        `🕵️ *AGENT ${pushName.toUpperCase()}*\n` +
        `_Classifié ULTRA-SECRET_ 🔴\n\n` +
        `${mission}\n\n` +
        `🎒 *Équipement :*\n` +
        `• ${g1}\n• ${g2}\n\n` +
        `⚠️ _Ce message s'autodétruira dans 10s._\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const mafia = {
  name: 'mafia',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, pushName } = ctx;
    const role = getRandom(MAFIA_ROLES);
    await antiBan.safeSend(sock, jid, {
      text:
        `🎭 *MAFIA — RÔLE SECRET*\n\n` +
        `_${pushName}, ton rôle est..._\n\n` +
        `${role.role}\n` +
        `🏴 Faction : *${role.faction}*\n` +
        `📖 ${role.desc}\n\n` +
        `⚡ *Pouvoir :* ${role.pouvoir}\n\n` +
        `_Garde ton rôle secret ! Ne le révèle à personne._\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const detectiveCmd = {
  name: 'detective',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    const suspects = ['Le Majordome Bertrand', 'Lady Mirabel', 'Professeur Holm', 'La Comtesse Irina', 'Le Jardinier Pascal'];
    const lieux = ['la bibliothèque', 'la cuisine', 'le grenier', 'le salon', 'la cave'];
    const armes = ['le chandelier', 'la corde', 'le poignard', 'le revolver', 'le poison'];
    const suspect = getRandom(suspects);
    const lieu = getRandom(lieux);
    const arme = getRandom(armes);
    await antiBan.safeSend(sock, jid, {
      text:
        `🔍 *ENQUÊTE EN COURS*\n\n` +
        `💀 Un meurtre a été commis au manoir !\n\n` +
        `🕵️ *Indices trouvés :*\n` +
        `• Suspect principal : *${suspect}*\n` +
        `• Lieu du crime : *${lieu}*\n` +
        `• Arme probable : *${arme}*\n\n` +
        `❓ Utilise *.accuse [nom]* pour accuser quelqu'un\n` +
        `💡 *.clue* pour plus d'indices\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const clue = {
  name: 'clue',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    const CLUES = [
      "🔍 Un cheveu gris a été retrouvé près du corps. La victime n'en avait pas.",
      "🔍 Une tasse de thé encore chaude indique que quelqu'un était là il y a moins de 20 minutes.",
      "🔍 La fenêtre était fermée de l'intérieur... mais comment le meurtrier est-il parti ?",
      "🔍 Le chien n'a pas aboyé cette nuit. Il connaissait donc l'intrus.",
      "🔍 Un ticket de train avec une destination mystérieuse trouvé dans la corbeille.",
      "🔍 L'agenda de la victime est ouvert sur une page arrachée.",
    ];
    await antiBan.safeSend(sock, jid, {
      text: `🔍 *NOUVEL INDICE*\n\n${getRandom(CLUES)}\n\n> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const accuse = {
  name: 'accuse',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, args } = ctx;
    const target = args.join(' ') || 'inconnu';
    const correct = Math.random() < 0.4;
    await antiBan.safeSend(sock, jid, {
      text:
        `⚖️ *ACCUSATION*\n\n` +
        `Tu accuses : *${target}*\n\n` +
        (correct
          ? `✅ *FÉLICITATIONS !* Tu as trouvé le coupable !\n_La vérité éclate au grand jour !_`
          : `❌ *RATÉ !* Ce n'est pas le coupable.\n_Continue d'enquêter avec .detective et .clue_`) +
        `\n\n> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const escapegame = {
  name: 'escapegame',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    const ROOMS = [
      { name: "Laboratoire Abandonné", puzzle: "Les flacons sont numérotés : 7-3-1-4. La serrure a 4 chiffres. Quel est le code ? (Additionnez les paires)", hint: "7+3=10, 1+4=5 → Code : 1005", },
      { name: "Bibliothèque Secrète", puzzle: "Les livres rouges = 3, bleus = 5, verts = 2. La porte s'ouvre avec le produit des livres rouges et verts.", hint: "3×2 = 6 → Code : 6" },
      { name: "Salle des Miroirs", puzzle: "Tu vois le message 'SIRAP' dans le miroir. Qu'est-ce que ça veut dire normalement ?", hint: "Retourné dans le miroir : PARIS" },
    ];
    const room = getRandom(ROOMS);
    await antiBan.safeSend(sock, jid, {
      text:
        `🔐 *ESCAPE GAME*\n\n` +
        `📍 Salle : *${room.name}*\n\n` +
        `🧩 Énigme :\n${room.puzzle}\n\n` +
        `💡 Utilise *.reponse [ta réponse]* pour tenter\n` +
        `🔑 Indice disponible avec *.clue*\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const codebreaker = {
  name: 'codebreaker',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    const codes = [
      { encoded: "KHOOR ZRUOG", method: "César +3", decoded: "HELLO WORLD" },
      { encoded: "AAAAABBBCC", method: "Fréquence (A=E, B=T, C=N)", decoded: "EEEEETTTNN" },
      { encoded: "01101000 01101001", method: "Binaire ASCII", decoded: "hi" },
      { encoded: ".- -... -.-.  -.. . ..-.  ...", method: "Morse", decoded: "ABC DES" },
    ];
    const c = getRandom(codes);
    await antiBan.safeSend(sock, jid, {
      text:
        `💻 *CODEBREAKER*\n\n` +
        `🔒 Message chiffré :\n` +
        `\`${c.encoded}\`\n\n` +
        `🔑 Méthode utilisée : _${c.method}_\n\n` +
        `❓ Peux-tu décoder ce message ?\n` +
        `Réponds avec *.reponse [décode]*\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const coldcase = {
  name: 'coldcase',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    const CASES = [
      "📁 *Affaire Fantôme — 1987*\nUne femme disparaît sans laisser de traces dans une ville côtière. Son sac, ses clés, son chien — tout est là. Elle, non. 30 ans plus tard, une lettre arrive chez son fils.",
      "📁 *L'Homme du Train — 2003*\nUn inconnu trouve mort dans le train Paris-Lyon. Aucun papier, aucune empreinte dans les fichiers. Qui était-il vraiment ?",
      "📁 *La Villa Maudite — 1995*\nTrois amis partent en week-end. Deux en reviennent. Le troisième est retrouvé 10 ans plus tard dans un bunker sellé de l'intérieur.",
    ];
    await antiBan.safeSend(sock, jid, {
      text:
        `🗂️ *COLD CASE — DOSSIER FROID*\n\n` +
        `${getRandom(CASES)}\n\n` +
        `🔍 Utilise *.clue* pour des indices\n` +
        `⚖️ *.accuse [suspect]* pour conclure\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const whodunnit = {
  name: 'whodunnit',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    const suspects = [
      { name: "Lord Ashford", motive: "Hériter du testament", alibi: "Prétend dormir — mais personne ne l'a vu", suspicious: "Des taches d'encre sur ses mains" },
      { name: "Dr. Simone", motive: "Vengeance personnelle", alibi: "En consultation... à minuit ?", suspicious: "Un foulard rouge manque à sa collection" },
      { name: "Chef Renard", motive: "Dettes de jeu", alibi: "En cuisine — mais le feu était éteint", suspicious: "Couteau à pain fraîchement aiguisé" },
    ];
    const s = getRandom(suspects);
    await antiBan.safeSend(sock, jid, {
      text:
        `🎭 *WHO DID IT ?*\n\n` +
        `*Suspect le plus probable :*\n\n` +
        `👤 *${s.name}*\n` +
        `🎯 Motif : ${s.motive}\n` +
        `🛡️ Alibi : ${s.alibi}\n` +
        `🔴 Suspect : ${s.suspicious}\n\n` +
        `⚖️ *.accuse ${s.name}* — pour accuser\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const origami = {
  name: 'origami',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    const o = getRandom(ORIGAMI);
    await antiBan.safeSend(sock, jid, {
      text:
        `🦢 *TUTO ORIGAMI*\n\n` +
        `📐 Figure : *${o.figure}*\n` +
        `🎯 Difficulté : ${o.difficulte}\n\n` +
        `📋 *Étapes :*\n` +
        o.steps.join('\n') +
        `\n\n> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

module.exports = {
  classCmd, spellbook, cast, guild, tavern, drink,
  spy, mafia, detectiveCmd, clue, accuse, escapegame, codebreaker, coldcase, whodunnit, origami
};
