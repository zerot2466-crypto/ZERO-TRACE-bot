/**
 * ZERO TRACE BOT v5.0 - Fun Pack 2
 * dice · flip · 8ball · rps · trivia · advice · dilem
 * waifu · senpai · quiz · anime · manga · battle · random
 */

// ── Données statiques ────────────────────────────────────────────────────────

const TRIVIA = [
  { q: "Combien d'os y a-t-il dans le corps humain adulte ?", a: "206" },
  { q: "Quelle est la capitale de l'Australie ?", a: "Canberra" },
  { q: "Quel est le plus grand océan du monde ?", a: "L'océan Pacifique" },
  { q: "En quelle année a eu lieu la première Coupe du Monde de football ?", a: "1930" },
  { q: "Quelle est la langue la plus parlée dans le monde ?", a: "Le mandarin (chinois)" },
  { q: "Combien de planètes dans notre système solaire ?", a: "8 planètes" },
  { q: "Quel animal est le plus rapide sur terre ?", a: "Le guépard" },
  { q: "Qui a peint la Joconde ?", a: "Léonard de Vinci" },
  { q: "Quelle est la formule chimique de l'eau ?", a: "H₂O" },
  { q: "Quel est le plus long fleuve d'Afrique ?", a: "Le Nil" },
  { q: "En quelle année a été fondé Facebook ?", a: "2004" },
  { q: "Quelle planète est surnommée la planète rouge ?", a: "Mars" },
];

const ADVICE = [
  "💡 Ne cours pas après ce qui s'éloigne. Ce qui est pour toi viendra à toi.",
  "🌱 Chaque grand arbre était autrefois une petite graine. Commence là où tu es.",
  "🔥 Le succès n'est pas définitif, l'échec n'est pas fatal. C'est le courage de continuer qui compte.",
  "🧠 Apprends quelque chose de nouveau chaque jour. Le savoir est la seule richesse qu'on ne peut voler.",
  "⚡ Ne dis jamais demain ce que tu peux faire aujourd'hui.",
  "🌙 Les nuits les plus sombres produisent les étoiles les plus brillantes.",
  "💪 Tes limitations ne sont que des opinions. Prouve-leur le contraire.",
  "🎯 Concentre-toi sur ce que tu peux contrôler. Lâche le reste.",
  "🤝 Entoure-toi de gens qui t'élèvent, pas qui te rabaissent.",
  "🚀 L'action guérit la peur. L'inaction la nourrit.",
  "🌊 Adapte-toi comme l'eau. Doux mais capable de percer la roche.",
  "❤️ Prends soin de toi en premier. Tu ne peux pas verser d'une coupe vide.",
];

const DILEMMES = [
  "Tu préfères : *Savoir lire les pensées* 🧠 ou *Voler* ✈️ ?\n\n> Réponds dans le groupe !",
  "Tu préfères : *Vivre 200 ans pauvre* 💸 ou *Vivre 60 ans très riche* 💰 ?",
  "Tu préfères : *Toujours dire la vérité* 😶 ou *Pouvoir mentir parfaitement* 🎭 ?",
  "Tu préfères : *Perdre la mémoire de tout* 🧹 ou *Tout te rappeler en détail* 📝 ?",
  "Tu préfères : *Être célèbre mais seul(e)* 🌟 ou *Inconnu(e) mais entouré(e) d'amour* ❤️ ?",
  "Tu préfères : *Voyager dans le passé* ⏪ ou *Dans le futur* ⏩ ?",
  "Tu préfères : *Parler toutes les langues* 🌍 ou *Jouer de tous les instruments* 🎵 ?",
  "Tu préfères : *Dormir 2h mais jamais fatigué* 😴 ou *Avoir toujours faim* 🍽️ ?",
  "Tu préfères : *Internet mais sans réseaux sociaux* 💻 ou *Réseaux sociaux mais sans Google* 📱 ?",
  "Tu préfères : *Être invisible à volonté* 👻 ou *Voler à volonté* 🦅 ?",
];

const ANIMES = [
  { title: "Attack on Titan", genre: "Action/Dark Fantasy", note: "⭐ 9.1/10", desc: "L'humanité survit derrière des murs gigantesques face aux Titans." },
  { title: "Death Note", genre: "Thriller/Psychologique", note: "⭐ 9.0/10", desc: "Un lycéen trouve un carnet capable de tuer n'importe qui." },
  { title: "Naruto Shippuden", genre: "Ninja/Action", note: "⭐ 8.7/10", desc: "Un jeune ninja rêve de devenir Hokage malgré son passé." },
  { title: "One Piece", genre: "Aventure/Pirates", note: "⭐ 9.2/10", desc: "Luffy et ses compagnons partent à la conquête du One Piece." },
  { title: "Fullmetal Alchemist: Brotherhood", genre: "Fantasy/Action", note: "⭐ 9.5/10", desc: "Deux frères cherchent la Pierre Philosophale pour réparer leurs erreurs." },
  { title: "Demon Slayer", genre: "Action/Surnaturel", note: "⭐ 8.9/10", desc: "Tanjiro devient tueur de démons pour sauver sa sœur transformée." },
  { title: "Hunter x Hunter", genre: "Aventure/Action", note: "⭐ 9.1/10", desc: "Gon part à la recherche de son père légendaire chasseur." },
  { title: "Steins;Gate", genre: "Sci-Fi/Thriller", note: "⭐ 9.1/10", desc: "Un scientifique découvre accidentellement le voyage dans le temps." },
];

const MANGAS = [
  { title: "Berserk", genre: "Dark Fantasy", auteur: "Kentaro Miura", desc: "Guts, le guerrier à l'épée monstrueuse, lutte contre le destin." },
  { title: "Vagabond", genre: "Historique/Arts martiaux", auteur: "Takehiko Inoue", desc: "La vie du légendaire samouraï Miyamoto Musashi." },
  { title: "Tokyo Ghoul", genre: "Dark Fantasy/Horreur", auteur: "Sui Ishida", desc: "Kaneki devient mi-humain mi-goule après une rencontre fatale." },
  { title: "Vinland Saga", genre: "Viking/Historique", auteur: "Makoto Yukimura", desc: "Thorfinn, fils de guerrier, cherche vengeance en terres nordiques." },
  { title: "JoJo's Bizarre Adventure", genre: "Action/Surnaturel", auteur: "Hirohiko Araki", desc: "La saga épique des Joestar à travers les générations." },
  { title: "Chainsaw Man", genre: "Dark Action/Horreur", auteur: "Tatsuki Fujimoto", desc: "Denji fusionne avec son démon-tronçonneuse pour survivre." },
];

const BATTLE_CLASSES = [
  { name: "Assassin", emoji: "🗡️", atk: 95, def: 40, spd: 98, skill: "Coup Fatal" },
  { name: "Mage Noir", emoji: "🔮", atk: 99, def: 35, spd: 75, skill: "Météore Infernal" },
  { name: "Paladin", emoji: "⚔️", atk: 75, def: 90, spd: 60, skill: "Jugement Divin" },
  { name: "Berserk", emoji: "💢", atk: 97, def: 50, spd: 70, skill: "Rage Totale" },
  { name: "Archer", emoji: "🏹", atk: 88, def: 45, spd: 92, skill: "Pluie de Flèches" },
  { name: "Nécromant", emoji: "💀", atk: 90, def: 55, spd: 65, skill: "Armée des Morts" },
  { name: "Moine", emoji: "☯️", atk: 80, def: 80, spd: 85, skill: "Frappe du Dragon" },
  { name: "Druide", emoji: "🌿", atk: 70, def: 75, spd: 80, skill: "Fureur de la Nature" },
];

const WAIFUS = [
  { name: "Mikasa Ackerman", serie: "Attack on Titan", trait: "Loyale, Redoutable, Protectrice", emoji: "⚔️" },
  { name: "Zero Two", serie: "DARLING in the FRANXX", trait: "Mystérieuse, Passionnée, Libre", emoji: "💗" },
  { name: "Rem", serie: "Re:Zero", trait: "Dévouée, Pure, Courageuse", emoji: "💙" },
  { name: "Nezuko Kamado", serie: "Demon Slayer", trait: "Mignonne, Forte, Protectrice", emoji: "🌸" },
  { name: "Erza Scarlet", serie: "Fairy Tail", trait: "Noble, Puissante, Juste", emoji: "🛡️" },
  { name: "Asuna Yuuki", serie: "Sword Art Online", trait: "Forte, Gentille, Déterminée", emoji: "⚡" },
  { name: "Robin (Nico)", serie: "One Piece", trait: "Calme, Intelligente, Énigmatique", emoji: "📖" },
  { name: "Violet Evergarden", serie: "Violet Evergarden", trait: "Touchante, Évoluée, Délicate", emoji: "💌" },
];

const pendingTrivia = new Map();

function getRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ── Commandes ────────────────────────────────────────────────────────────────

const dice = {
  name: 'de2',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, args } = ctx;
    const sides = parseInt(args[0]) || 6;
    if (sides < 2 || sides > 100) {
      await antiBan.safeSend(sock, jid, { text: '🎲 Utilise : *.dice [faces]*\nEx : *.dice 20* (dé à 20 faces, max 100)' }, { msgOptions: { quoted: msg } });
      return;
    }
    const result = Math.floor(Math.random() * sides) + 1;
    const bar = '█'.repeat(Math.round((result / sides) * 10)) + '░'.repeat(10 - Math.round((result / sides) * 10));
    await antiBan.safeSend(sock, jid, {
      text:
        `🎲 *LANCER DE DÉ (D${sides})*\n\n` +
        `┌─────────────────┐\n` +
        `│   Résultat : *${result}*${result < 10 ? '  ' : ' '}│\n` +
        `│   ${bar} │\n` +
        `│   Max : ${sides}           │\n` +
        `└─────────────────┘\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const flip = {
  name: 'flip',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    const result = Math.random() < 0.5;
    const side = result ? 'PILE 🟡' : 'FACE 🔵';
    const emoji = result ? '🌕' : '🌑';
    await antiBan.safeSend(sock, jid, {
      text:
        `${emoji} *PILE OU FACE*\n\n` +
        `La pièce tourne dans les airs...\n` +
        `💫 ➜ 💫 ➜ 💫\n\n` +
        `Résultat : *${side}*\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const eightball = {
  name: '8ball2',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, args } = ctx;
    const ANSWERS_OUI = [
      "🟢 *Absolument.* Les signes sont clairs.",
      "🟢 *Oui, sans aucun doute.*",
      "🟢 *Très probablement.* Fonce !",
      "🟢 *Les étoiles te sourient. Oui.*",
      "🟢 *Compte dessus.*",
    ];
    const ANSWERS_NON = [
      "🔴 *Non.* Pas dans cette vie.",
      "🔴 *Mes sources disent non.*",
      "🔴 *Très peu probable.*",
      "🔴 *L'univers dit non. Clairement.*",
      "🔴 *Oublie ça.*",
    ];
    const ANSWERS_PEUT = [
      "🟡 *C'est flou... Réessaie.*",
      "🟡 *La réponse n'est pas claire.*",
      "🟡 *Concentre-toi et redemande.*",
      "🟡 *Ni oui ni non... pour l'instant.*",
    ];
    const question = args.join(' ');
    if (!question) {
      await antiBan.safeSend(sock, jid, { text: '🎱 Pose-moi une question !\nEx : *.8ball Vais-je réussir ?*' }, { msgOptions: { quoted: msg } });
      return;
    }
    const all = [...ANSWERS_OUI, ...ANSWERS_NON, ...ANSWERS_PEUT];
    const answer = getRandom(all);
    await antiBan.safeSend(sock, jid, {
      text:
        `🎱 *MAGIC 8-BALL*\n\n` +
        `❓ *Question :* ${question}\n\n` +
        `🔮 *Réponse :*\n${answer}\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const rps = {
  name: 'pfc2',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, args } = ctx;
    const choices = { pierre: '🪨', papier: '📄', ciseaux: '✂️', rock: '🪨', paper: '📄', scissors: '✂️' };
    const wins = { pierre: 'ciseaux', papier: 'pierre', ciseaux: 'papier' };
    const normalize = { rock: 'pierre', paper: 'papier', scissors: 'ciseaux' };

    let user = args[0]?.toLowerCase();
    if (normalize[user]) user = normalize[user];

    if (!choices[user] || !['pierre','papier','ciseaux'].includes(user)) {
      await antiBan.safeSend(sock, jid, {
        text: '✂️ *Pierre-Papier-Ciseaux*\n\nUtilise : *.rps pierre* | *.rps papier* | *.rps ciseaux*',
      }, { msgOptions: { quoted: msg } });
      return;
    }
    const botChoice = getRandom(['pierre', 'papier', 'ciseaux']);
    let result;
    if (user === botChoice) result = '🤝 *Égalité !*';
    else if (wins[user] === botChoice) result = '🎉 *Tu gagnes !* GG';
    else result = '💀 *Tu perds !* Mieux la prochaine fois.';

    await antiBan.safeSend(sock, jid, {
      text:
        `✂️ *PIERRE - PAPIER - CISEAUX*\n\n` +
        `👤 Toi   : ${choices[user]} ${user}\n` +
        `🤖 Bot   : ${choices[botChoice]} ${botChoice}\n\n` +
        `${result}\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const trivia = {
  name: 'trivia',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    const q = getRandom(TRIVIA);
    pendingTrivia.set(jid, q.a.toLowerCase());
    setTimeout(() => pendingTrivia.delete(jid), 60000);
    await antiBan.safeSend(sock, jid, {
      text:
        `🧠 *TRIVIA*\n\n` +
        `❓ ${q.q}\n\n` +
        `_Réponds avec_ *.reponse [ta réponse]*\n` +
        `_(60 secondes pour répondre)_\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
  pendingTrivia,
};

const advice = {
  name: 'advice',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, pushName } = ctx;
    const tip = getRandom(ADVICE);
    await antiBan.safeSend(sock, jid, {
      text:
        `🌟 *CONSEIL DU JOUR*\n` +
        `_Pour toi, ${pushName}_ ✨\n\n` +
        `${tip}\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const dilem = {
  name: 'dilem',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    const d = getRandom(DILEMMES);
    await antiBan.safeSend(sock, jid, {
      text:
        `🤔 *DILEMME DU JOUR*\n\n` +
        `${d}\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const waifu = {
  name: 'waifu',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, pushName } = ctx;
    const w = getRandom(WAIFUS);
    await antiBan.safeSend(sock, jid, {
      text:
        `${w.emoji} *WAIFU DU JOUR*\n` +
        `_Pour ${pushName}_ 💕\n\n` +
        `*Nom :* ${w.name}\n` +
        `*Série :* ${w.serie}\n` +
        `*Traits :* ${w.trait}\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const senpai = {
  name: 'senpai',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, pushName } = ctx;
    const SENPAIS = [
      "🎌 Ton senpai du jour est *Itachi Uchiha* — _Force silencieuse, sacrifice ultime._",
      "🎌 Ton senpai du jour est *Levi Ackerman* — _Discipline, précision, excellence._",
      "🎌 Ton senpai du jour est *Gojo Satoru* — _Confiance absolue en soi._",
      "🎌 Ton senpai du jour est *All Might* — _Être le symbole dont les autres ont besoin._",
      "🎌 Ton senpai du jour est *Aizen Sosuke* — _Intelligence stratégique sans limite._",
      "🎌 Ton senpai du jour est *Whitebeard* — _La famille avant tout._",
    ];
    await antiBan.safeSend(sock, jid, {
      text:
        `🎌 *SENPAI DU JOUR*\n` +
        `_${pushName}, écoute les paroles du sage..._ 🙏\n\n` +
        `${getRandom(SENPAIS)}\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const quiz = {
  name: 'quizmulti',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    const QUIZ_MULTI = [
      {
        q: "Quel langage de programmation est à la base du web ?",
        opts: ["A) Python", "B) JavaScript", "C) Java", "D) PHP"],
        a: "B", expl: "JavaScript est le langage natif des navigateurs web."
      },
      {
        q: "Que signifie 'HTTP' ?",
        opts: ["A) HyperText Transfer Protocol", "B) High Tech Transfer Program", "C) Host Transfer Text Protocol", "D) HyperLink Transfer Process"],
        a: "A", expl: "HTTP = HyperText Transfer Protocol, base du web."
      },
      {
        q: "Quel est le système d'exploitation le plus utilisé sur les serveurs ?",
        opts: ["A) Windows Server", "B) macOS Server", "C) Linux", "D) FreeBSD"],
        a: "C", expl: "Linux domine les serveurs avec plus de 90% de part de marché."
      },
      {
        q: "Qu'est-ce qu'une adresse IP ?",
        opts: ["A) Un identifiant unique pour un appareil réseau", "B) Un mot de passe réseau", "C) Un protocole de sécurité", "D) Un type de câble réseau"],
        a: "A", expl: "Une adresse IP identifie un appareil sur un réseau."
      },
    ];
    const q = getRandom(QUIZ_MULTI);
    pendingTrivia.set(jid + '_quiz', q.a.toLowerCase());
    pendingTrivia.set(jid + '_quiz_expl', q.expl);
    setTimeout(() => { pendingTrivia.delete(jid + '_quiz'); pendingTrivia.delete(jid + '_quiz_expl'); }, 60000);
    await antiBan.safeSend(sock, jid, {
      text:
        `📚 *QUIZ TECH*\n\n` +
        `❓ *${q.q}*\n\n` +
        q.opts.join('\n') + '\n\n' +
        `_Réponds avec_ *.reponse A/B/C/D*\n` +
        `_(60 secondes)_\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const anime = {
  name: 'anime',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, args } = ctx;
    if (args[0]) {
      const search = args.join(' ').toLowerCase();
      const found = ANIMES.find(a => a.title.toLowerCase().includes(search));
      if (found) {
        await antiBan.safeSend(sock, jid, {
          text:
            `🎌 *${found.title}*\n\n` +
            `📁 Genre : ${found.genre}\n` +
            `⭐ Note : ${found.note}\n` +
            `📖 Synopsis : ${found.desc}\n\n` +
            `> *ZERO TRACE BOT v5.0*`,
        }, { msgOptions: { quoted: msg } });
        return;
      }
    }
    const a = getRandom(ANIMES);
    await antiBan.safeSend(sock, jid, {
      text:
        `🎌 *ANIME DU JOUR*\n\n` +
        `🎬 *${a.title}*\n` +
        `📁 Genre : ${a.genre}\n` +
        `${a.note}\n` +
        `📖 ${a.desc}\n\n` +
        `💡 _Tip : .anime [titre] pour chercher_\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const manga = {
  name: 'manga',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, args } = ctx;
    if (args[0]) {
      const search = args.join(' ').toLowerCase();
      const found = MANGAS.find(m => m.title.toLowerCase().includes(search));
      if (found) {
        await antiBan.safeSend(sock, jid, {
          text:
            `📚 *${found.title}*\n\n` +
            `✍️ Auteur : ${found.auteur}\n` +
            `📁 Genre : ${found.genre}\n` +
            `📖 ${found.desc}\n\n` +
            `> *ZERO TRACE BOT v5.0*`,
        }, { msgOptions: { quoted: msg } });
        return;
      }
    }
    const m = getRandom(MANGAS);
    await antiBan.safeSend(sock, jid, {
      text:
        `📚 *MANGA DU JOUR*\n\n` +
        `📖 *${m.title}*\n` +
        `✍️ Auteur : ${m.auteur}\n` +
        `📁 Genre : ${m.genre}\n` +
        `💬 ${m.desc}\n\n` +
        `💡 _Tip : .manga [titre] pour chercher_\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const battle = {
  name: 'battle',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, args } = ctx;
    const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const sender = ctx.sender;

    const p1Class = getRandom(BATTLE_CLASSES);
    const p2Class = getRandom(BATTLE_CLASSES);

    const calcDmg = (atk, def) => Math.max(1, Math.floor(atk * (1 - def / 200) * (0.8 + Math.random() * 0.4)));
    let hp1 = 100, hp2 = 100;
    const log = [];
    let turn = 0;
    while (hp1 > 0 && hp2 > 0 && turn < 10) {
      turn++;
      const dmg1 = calcDmg(p1Class.atk, p2Class.def);
      const dmg2 = calcDmg(p2Class.atk, p1Class.def);
      hp2 -= dmg1; hp1 -= dmg2;
      log.push(`Tour ${turn}: ⚔️ ${p1Class.name} frappe (-${dmg1}) | ${p2Class.name} contre-attaque (-${dmg2})`);
    }

    const p1Name = mentions[0] ? '@' + mentions[0].split('@')[0] : 'Joueur 1';
    const p2Name = mentions[1] ? '@' + mentions[1].split('@')[0] : 'Bot';
    const winner = hp1 > hp2 ? `🏆 *${p1Name} GAGNE !*` : hp2 > hp1 ? `🏆 *${p2Name} GAGNE !*` : '🤝 *ÉGALITÉ !*';

    await antiBan.safeSend(sock, jid, {
      text:
        `⚔️ *BATTLE ÉPIQUE*\n\n` +
        `${p1Class.emoji} *${p1Name}* — ${p1Class.name}\n` +
        `${p2Class.emoji} *${p2Name}* — ${p2Class.name}\n\n` +
        `━━━━━━━━━━━━━━━━\n` +
        log.slice(-3).join('\n') + '\n' +
        `━━━━━━━━━━━━━━━━\n\n` +
        `${winner}\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
      mentions,
    }, { msgOptions: { quoted: msg } });
  },
};

const random = {
  name: 'random',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, args } = ctx;
    if (args.length >= 2) {
      const min = parseInt(args[0]);
      const max = parseInt(args[1]);
      if (!isNaN(min) && !isNaN(max) && min < max) {
        const r = Math.floor(Math.random() * (max - min + 1)) + min;
        await antiBan.safeSend(sock, jid, {
          text: `🎲 *Nombre aléatoire entre ${min} et ${max} :*\n\n➜ *${r}*\n\n> *ZERO TRACE BOT v5.0*`,
        }, { msgOptions: { quoted: msg } });
        return;
      }
    }
    const r = Math.floor(Math.random() * 1000) + 1;
    await antiBan.safeSend(sock, jid, {
      text: `🎲 *Nombre aléatoire (1-1000) :*\n\n➜ *${r}*\n\n💡 _Tip : .random [min] [max]_\n\n> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

module.exports = { dice, flip, eightball, rps, trivia, advice, dilem, waifu, senpai, quiz, anime, manga, battle, random };
