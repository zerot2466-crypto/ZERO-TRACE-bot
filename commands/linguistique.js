/**
 * ZERO TRACE BOT v5.0 - Linguistique
 * palindrome · tonguetwister · idiom · braille · slang · fauxami · pangram · proverb · deadlanguage · accent · portmanteau · signlanguage · dialect
 */
'use strict';

function getRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ── BRAILLE (Unicode) ─────────────────────────────────────────────────────────
const BRAILLE = {
  a:'⠁',b:'⠃',c:'⠉',d:'⠙',e:'⠑',f:'⠋',g:'⠛',h:'⠓',i:'⠊',j:'⠚',
  k:'⠅',l:'⠇',m:'⠍',n:'⠝',o:'⠕',p:'⠏',q:'⠟',r:'⠗',s:'⠎',t:'⠞',
  u:'⠥',v:'⠧',w:'⠺',x:'⠭',y:'⠽',z:'⠵',
  ' ':'⠀','é':'⠿','è':'⠷','ê':'⠣','à':'⠡','ô':'⠹','ù':'⠾','â':'⠣',
  '0':'⠴','1':'⠂','2':'⠆','3':'⠒','4':'⠲','5':'⠢','6':'⠖','7':'⠶','8':'⠦','9':'⠔',
  '.':'⠲',',':'⠂','?':'⠦','!':'⠖',':':'⠒',';':'⠆','-':'⠤'
};

function toBraille(text) {
  return text.toLowerCase().split('').map(c => BRAILLE[c] || c).join('');
}

// ── DATA ──────────────────────────────────────────────────────────────────────
const TONGUE_TWISTERS = [
  { text: "Les chaussettes de l'archiduchesse sont-elles sèches, archi-sèches ?", level: "⭐⭐ Difficile" },
  { text: "Un chasseur sachant chasser sait chasser sans son chien.", level: "⭐ Facile" },
  { text: "Seize chaises sèches.", level: "⭐ Facile" },
  { text: "Dis-moi gros, gras, grand grain d'orge, quand te dégros-gros-grand-grain-d'orgeras-tu ?", level: "⭐⭐⭐ Expert" },
  { text: "Bonjour madame Sans-Souci ! Combien sont ces saucissons-ci ? Ces six saucissons-ci sont six sous.", level: "⭐⭐ Difficile" },
  { text: "Si six scies scient six cyprès, six cents scies scient six cents cyprès.", level: "⭐⭐⭐ Expert" },
];

const IDIOMS = [
  { expr: "Avoir le cafard", meaning: "Se sentir déprimé, mélancolique", origin: "Baudelaire → 'Les Fleurs du mal'" },
  { expr: "Casser les pieds", meaning: "Ennuyer, importuner quelqu'un", origin: "Argot militaire du XIXe siècle" },
  { expr: "Il pleut des cordes", meaning: "Il pleut très fort", origin: "Référence aux cordages trempés des marins" },
  { expr: "Poser un lapin", meaning: "Ne pas se présenter à un rendez-vous", origin: "Argot du XIXe siècle" },
  { expr: "Avoir d'autres chats à fouetter", meaning: "Avoir des choses plus importantes à faire", origin: "Expression médiévale" },
  { expr: "Tomber dans les pommes", meaning: "S'évanouir", origin: "Possible déformation de 'tomber en pâmoison'" },
  { expr: "Avoir le beurre et l'argent du beurre", meaning: "Vouloir tout avoir sans contrepartie", origin: "Expression commerciale du XIXe siècle" },
  { expr: "Ça ne casse pas trois pattes à un canard", meaning: "Ce n'est pas exceptionnel, très ordinaire", origin: "Expression populaire" },
];

const FALSE_FRIENDS = [
  { french: "Actuel", english_look: "Actual", real_en: "Current / Present", trap: "'Actual' en anglais = réel/vrai, pas actuel" },
  { french: "Librairie", english_look: "Library", real_en: "Bookshop", trap: "'Library' = bibliothèque (gratuite), pas librairie" },
  { french: "Journée", english_look: "Journey", real_en: "Day / Daytime", trap: "'Journey' = voyage, pas journée" },
  { french: "Location", english_look: "Location", real_en: "Rental", trap: "'Location' anglais = emplacement, en français = location = rental" },
  { french: "Rester", english_look: "Rest", real_en: "To stay / Remain", trap: "'Rest' anglais = se reposer, pas rester" },
  { french: "Éventuellement", english_look: "Eventually", real_en: "Possibly / Perhaps", trap: "'Eventually' anglais = finalement, pas éventuellement" },
  { french: "Sensible", english_look: "Sensible", real_en: "Sensitive", trap: "'Sensible' anglais = raisonnable/logique, pas sensible" },
  { french: "Prétendre", english_look: "Pretend", real_en: "To claim / Maintain", trap: "'Pretend' anglais = faire semblant, pas prétendre" },
];

const PANGRAMS = [
  { text: "Portez ce vieux whisky au juge blond qui fume.", note: "Le plus court pangram français (42 lettres)" },
  { text: "Voyez ce jeu exquis de femmes qui font valser kobolds et puis zarbi.", note: "Pangram créatif" },
  { text: "The quick brown fox jumps over the lazy dog.", note: "Le pangram anglais le plus célèbre (43 lettres)" },
  { text: "Quand le vieux juge blond aux yeux bruns fumait du xérès.", note: "Pangram classique" },
];

const PROVERBS = [
  { proverb: "Il ne faut pas vendre la peau de l'ours avant de l'avoir tué.", meaning: "Il ne faut pas compter sur quelque chose avant de l'avoir réellement obtenu." },
  { proverb: "Les chiens ne font pas des chats.", meaning: "Les enfants ressemblent à leurs parents." },
  { proverb: "Mieux vaut tard que jamais.", meaning: "Il vaut mieux faire quelque chose en retard que de ne pas le faire du tout." },
  { proverb: "L'habit ne fait pas le moine.", meaning: "Les apparences peuvent être trompeuses." },
  { proverb: "Qui sème le vent récolte la tempête.", meaning: "Les mauvaises actions ont de mauvaises conséquences." },
  { proverb: "Pierre qui roule n'amasse pas mousse.", meaning: "Une personne qui change souvent de place ou d'activité ne peut pas s'enrichir ni s'épanouir." },
  { proverb: "Le chat parti, les souris dansent.", meaning: "Quand le responsable n'est pas là, les subordonnés font ce qu'ils veulent." },
  { proverb: "Aide-toi, le ciel t'aidera.", meaning: "Il faut d'abord compter sur ses propres efforts." },
];

const DEAD_LANGUAGES = [
  { name: "Latin", region: "Empire Romain", died: "~600 ap. J.-C.", fact: "Langue mère du français, espagnol, italien, portugais et roumain. Encore utilisé au Vatican.", sample: "'Veni, vidi, vici' — César : Je suis venu, j'ai vu, j'ai vaincu" },
  { name: "Sumérien", region: "Mésopotamie (Irak actuel)", died: "~2000 av. J.-C.", fact: "La plus ancienne langue écrite connue. Inventeurs de l'écriture cunéiforme.", sample: "'An' = ciel, 'Ki' = terre" },
  { name: "Vieux-Egyptien", region: "Egypte ancienne", died: "~400 ap. J.-C.", fact: "Déchiffré grâce à la Pierre de Rosette en 1822 par Champollion.", sample: "𓀀 𓁐 𓃠 — Hiéroglyphes" },
  { name: "Gothique", region: "Germanie / Balkans", died: "~700 ap. J.-C.", fact: "Langue des Wisigoths. On possède presque uniquement la Bible de Wulfila.", sample: "'Wulfila' = petit loup" },
  { name: "Cornique", region: "Cornouailles, Angleterre", died: "~1777 ap. J.-C.", fact: "La dernière locutrice native, Dolly Pentreath, est morte en 1777. Langue en cours de revitalisation.", sample: "'Myttin da' = Bonjour" },
];

const SLANG_FR = [
  { mot: "Wesh", meaning: "Salut / Hey (interjection)", usage: "'Wesh frère, t'es où ?'" },
  { mot: "Ouf", meaning: "Fou (verlan de 'fou')", usage: "'Ce film est ouf !'" },
  { mot: "Zarbi", meaning: "Bizarre (verlan de 'bizarre')", usage: "'Ton comportement est vraiment zarbi'" },
  { mot: "Relou", meaning: "Lourd/Chiant (verlan de 'lourd')", usage: "'Arrête, t'es trop relou'" },
  { mot: "Béton", meaning: "Bien/Super (verlan de 'bon')", usage: "'Le concert était béton'" },
  { mot: "Flouze", meaning: "De l'argent", usage: "'J'ai pas de flouze sur moi'" },
  { mot: "Checker", meaning: "Vérifier / Regarder", usage: "'Check ça, c'est dingue'" },
  { mot: "Kiffer", meaning: "Aimer / Apprécier", usage: "'Je kiffe trop cette chanson'" },
  { mot: "Grailler", meaning: "Manger", usage: "'On va grailler où ce soir ?'" },
  { mot: "Boloss", meaning: "Personne naïve/perdante", usage: "'Ne sois pas un boloss'" },
];

const PORTMANTEAUX = [
  { word: "Brunch", from: "Breakfast + Lunch", lang: "🇬🇧" },
  { word: "Smog", from: "Smoke + Fog", lang: "🇬🇧" },
  { word: "Motel", from: "Motor + Hotel", lang: "🇺🇸" },
  { word: "Pixel", from: "Picture + Element", lang: "🇺🇸" },
  { word: "Courriel", from: "Courrier + Électronique", lang: "🇫🇷" },
  { word: "Informatique", from: "Information + Automatique", lang: "🇫🇷" },
  { word: "Pédiluve", from: "Pied + Éluver (laver)", lang: "🇫🇷" },
  { word: "Emoticône", from: "Émotion + Icône", lang: "🇫🇷" },
  { word: "Pourriel", from: "Pourri + Courriel", lang: "🇨🇦" },
];

const ACCENTS = [
  { region: "Marseillais 🌊", trait: "O ouvert, roulements des R, accent tonique final", example: "'Le soleil BRILLE sur LA mer' → accent sur dernière syllabe", tip: "Imagine qu'ils chantent chaque phrase" },
  { region: "Ch'timi 🏭", trait: "CH prononcé SH, voyelles nasalisées", example: "'Chui ch'timi' = Je suis du Nord", tip: "La langue semble chanter lentement" },
  { region: "Québécois 🍁", trait: "T et D mouillés, 'tu' souvent 't'', vocabulaire unique", example: "'T'as-tu vu ça ?' → Tu as vu ça ?", tip: "Plus proche du français du 17e siècle" },
  { region: "Belge 🇧🇪", trait: "70/80 = septante/huitante, intonation montante", example: "Quatre-vingts → 'octante', soixante-dix → 'septante'", tip: "La logique belge est en fait plus logique que le français !" },
  { region: "Parisien 🗼", trait: "Élision forte, voyelles avalées, débit rapide", example: "'T'as vu l'film qu'y'a sorti ?' = 'As-tu vu le film qui est sorti ?'", tip: "La rapidité est une marque d'appartenance" },
];

const SIGN_LANGUAGE = [
  { sign: "👋", meaning: "Bonjour / Au revoir", detail: "Agiter la main ouvertement" },
  { sign: "👍", meaning: "Bien / D'accord / Oui", detail: "Pouce levé" },
  { sign: "👎", meaning: "Non / Mauvais", detail: "Pouce baissé" },
  { sign: "🤟", meaning: "Je t'aime (ASL)", detail: "Pouce, index et auriculaire levés" },
  { sign: "✌️", meaning: "Paix / 2 / Victoire", detail: "Index et majeur levés" },
  { sign: "🤌", meaning: "Signaux d'incompréhension (LSF)", detail: "Doigts jointifs, mouvement de la main" },
  { sign: "✋", meaning: "Stop / 5 / Attends", detail: "Main ouverte levée" },
  { sign: "🤏", meaning: "Petit / Peu", detail: "Pouce et index presque joints" },
];

// ── PALINDROME ────────────────────────────────────────────────────────────────
function checkPalindrome(text) {
  const clean = text.toLowerCase().replace(/[^a-zàâéèêëîïôùûüç]/g, '');
  return clean === clean.split('').reverse().join('');
}

const FAMOUS_PALINDROMES = [
  "'Élu par cette crapule'", "'À l'étape, épate-la'",
  "'Été'", "'Ressasser'", "'Kayak'", "'Radar'",
  "'Roma tibi subito motibus ibit amor' (latin)",
  "'Able was I ere I saw Elba' (anglais, Napoléon)",
];

// ── EXPORT COMMANDES ──────────────────────────────────────────────────────────

const palindrome = {
  name: 'palindrome',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, args } = ctx;
    const word = args.join(' ').trim();
    if (word) {
      const isPal = checkPalindrome(word);
      await antiBan.safeSend(sock, jid, {
        text:
          `🔄 *PALINDROME*\n\n` +
          `Mot/phrase : *"${word}"*\n\n` +
          (isPal ? `✅ Oui, c'est un palindrome !` : `❌ Non, ce n'est pas un palindrome.`) +
          `\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    } else {
      await antiBan.safeSend(sock, jid, {
        text:
          `🔄 *PALINDROMES CÉLÈBRES*\n\n` +
          getRandom(FAMOUS_PALINDROMES) + `\n\n` +
          `Un palindrome se lit pareil dans les deux sens.\n\n` +
          `💡 *.palindrome [mot]* pour vérifier un mot\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};

const tonguetwister = {
  name: 'tonguetwister',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    const tt = getRandom(TONGUE_TWISTERS);
    await antiBan.safeSend(sock, jid, {
      text:
        `👅 *VIRELANGUE*\n\n` +
        `${tt.level}\n\n` +
        `_"${tt.text}"_\n\n` +
        `Répète 3 fois rapidement ! 🏁\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const idiom = {
  name: 'idiom',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    const id = getRandom(IDIOMS);
    await antiBan.safeSend(sock, jid, {
      text:
        `💬 *EXPRESSION FRANÇAISE*\n\n` +
        `📝 *"${id.expr}"*\n\n` +
        `💡 Sens : ${id.meaning}\n` +
        `📖 Origine : ${id.origin}\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const braille = {
  name: 'braille',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, args } = ctx;
    const text = args.join(' ').trim();
    if (!text) {
      await antiBan.safeSend(sock, jid, {
        text: `⠃⠗⠁⠊⠇⠇⠑ *BRAILLE*\n\nUsage : *.braille [texte]*\nEx : *.braille bonjour*\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
      return;
    }
    const result = toBraille(text);
    await antiBan.safeSend(sock, jid, {
      text:
        `⠃⠗⠁⠊⠇⠇⠑ *CONVERSION BRAILLE*\n\n` +
        `📝 Texte : ${text}\n\n` +
        `👁️ Braille :\n${result}\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const slang = {
  name: 'slang',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, args } = ctx;
    const search = args.join(' ').toLowerCase().trim();
    if (search) {
      const found = SLANG_FR.find(s => s.mot.toLowerCase().includes(search) || search.includes(s.mot.toLowerCase()));
      if (found) {
        await antiBan.safeSend(sock, jid, {
          text: `🗣️ *ARGOT*\n\n*${found.mot}*\n💬 ${found.meaning}\n✏️ ${found.usage}\n\n> *ZERO TRACE BOT v5.0*`,
        }, { msgOptions: { quoted: msg } });
        return;
      }
    }
    const s = getRandom(SLANG_FR);
    await antiBan.safeSend(sock, jid, {
      text:
        `🗣️ *ARGOT FRANÇAIS*\n\n` +
        `*${s.mot}*\n\n` +
        `💬 Sens : ${s.meaning}\n` +
        `✏️ Exemple : _"${s.usage}"_\n\n` +
        `💡 *.slang [mot]* pour chercher\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const fauxami = {
  name: 'fauxami',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    const fa = getRandom(FALSE_FRIENDS);
    await antiBan.safeSend(sock, jid, {
      text:
        `⚠️ *FAUX AMI (FR/EN)*\n\n` +
        `🇫🇷 *"${fa.french}"*\n` +
        `→ ressemble à "**${fa.english_look}**" en anglais\n\n` +
        `❌ Piège : ${fa.trap}\n\n` +
        `✅ Traduction correcte : *${fa.real_en}*\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const pangram = {
  name: 'pangram',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, args } = ctx;
    const text = args.join(' ').trim();
    if (text) {
      const letters = new Set(text.toLowerCase().replace(/[^a-z]/g, ''));
      const missing = 'abcdefghijklmnopqrstuvwxyz'.split('').filter(l => !letters.has(l));
      const isPangram = missing.length === 0;
      await antiBan.safeSend(sock, jid, {
        text:
          `📖 *VÉRIFICATION PANGRAM*\n\n` +
          `"${text}"\n\n` +
          (isPangram
            ? `✅ C'est un pangram ! Toutes les 26 lettres sont présentes.`
            : `❌ Pas un pangram.\nLettres manquantes : *${missing.join(', ')}*`) +
          `\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
      return;
    }
    const p = getRandom(PANGRAMS);
    await antiBan.safeSend(sock, jid, {
      text:
        `📖 *PANGRAM*\n\n` +
        `_"${p.text}"_\n\n` +
        `ℹ️ ${p.note}\n\n` +
        `Un pangram utilise chaque lettre de l'alphabet au moins une fois.\n\n` +
        `💡 *.pangram [texte]* pour vérifier le tien\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const proverb = {
  name: 'proverb',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    const p = getRandom(PROVERBS);
    await antiBan.safeSend(sock, jid, {
      text:
        `📜 *PROVERBE*\n\n` +
        `_"${p.proverb}"_\n\n` +
        `💡 ${p.meaning}\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const deadlanguage = {
  name: 'deadlanguage',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    const dl = getRandom(DEAD_LANGUAGES);
    await antiBan.safeSend(sock, jid, {
      text:
        `💀 *LANGUE MORTE*\n\n` +
        `🏛️ *${dl.name}*\n` +
        `📍 Région : ${dl.region}\n` +
        `📅 Disparition : ${dl.died}\n\n` +
        `📖 ${dl.fact}\n\n` +
        `✍️ Exemple : _${dl.sample}_\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const accent = {
  name: 'accent',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    const a = getRandom(ACCENTS);
    await antiBan.safeSend(sock, jid, {
      text:
        `🗣️ *ACCENT — ${a.region}*\n\n` +
        `🎵 Trait principal : ${a.trait}\n\n` +
        `📢 Exemple : _"${a.example}"_\n\n` +
        `💡 Astuce : ${a.tip}\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const portmanteau = {
  name: 'portmanteau',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    const p = getRandom(PORTMANTEAUX);
    await antiBan.safeSend(sock, jid, {
      text:
        `🔀 *MOT-VALISE (Portmanteau)*\n\n` +
        `${p.lang} *${p.word}*\n\n` +
        `Formé de : ${p.from}\n\n` +
        `Un mot-valise fusionne deux mots pour créer un nouveau concept.\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const signlanguage = {
  name: 'signlanguage',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    const sl = getRandom(SIGN_LANGUAGE);
    await antiBan.safeSend(sock, jid, {
      text:
        `🤟 *LANGUE DES SIGNES*\n\n` +
        `Geste : ${sl.sign}\n\n` +
        `💬 Signification : *${sl.meaning}*\n` +
        `✋ Description : ${sl.detail}\n\n` +
        `_LSF = Langue des Signes Française_\n` +
        `_ASL = American Sign Language_\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const dialect = {
  name: 'dialect',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    const a = getRandom(ACCENTS);
    await antiBan.safeSend(sock, jid, {
      text:
        `🌍 *DIALECTE / VARIANTE — ${a.region}*\n\n` +
        `Caractéristique : ${a.trait}\n\n` +
        `Exemple : _"${a.example}"_\n\n` +
        `ℹ️ ${a.tip}\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

module.exports = {
  palindrome, tonguetwister, idiom, braille, slang, fauxami,
  pangram, proverb, deadlanguage, accent, portmanteau, signlanguage, dialect
};
