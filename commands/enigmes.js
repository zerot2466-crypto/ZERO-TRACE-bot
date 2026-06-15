/**
 * ZERO TRACE BOT v5.0 - Énigmes & Puzzles
 * morse · cipher · sudoku · maze · rebus · crossword · kenken · puzzle · riddles
 */
'use strict';

function getRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ── MORSE ─────────────────────────────────────────────────────────────────────
const MORSE_MAP = {
  a:'.-',b:'-...',c:'-.-.',d:'-..',e:'.',f:'..-.',g:'--.',h:'....',i:'..',
  j:'.---',k:'-.-',l:'.-..',m:'--',n:'-.',o:'---',p:'.--.',q:'--.-',r:'.-.',
  s:'...',t:'-',u:'..-',v:'...-',w:'.--',x:'-..-',y:'-.--',z:'--..',
  '0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....',
  '6':'-....','7':'--...','8':'---..','9':'----.','.':'.-.-.-',',':'--..--',
  '?':'..--..','!':'-.-.--',' ':'/'
};
const MORSE_REVERSE = Object.fromEntries(Object.entries(MORSE_MAP).map(([k,v])=>[v,k]));

function textToMorse(text) {
  return text.toLowerCase().split('').map(c => MORSE_MAP[c] || '').filter(Boolean).join(' ');
}
function morseToText(morse) {
  return morse.split(' ').map(c => c === '/' ? ' ' : (MORSE_REVERSE[c] || '?')).join('');
}

// ── CAESAR CIPHER ─────────────────────────────────────────────────────────────
function caesarEncode(text, shift) {
  return text.replace(/[a-zA-Z]/g, c => {
    const base = c < 'a' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + shift) % 26) + base);
  });
}
function caesarDecode(text, shift) { return caesarEncode(text, 26 - shift); }

// ── SUDOKU (grilles pré-validées) ─────────────────────────────────────────────
const SUDOKU_PUZZLES = [
  {
    puzzle:   '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
    solution: '534678912672195348198342567859761423426853791713924856961537284287419635345286179',
    level: '⭐ Facile'
  },
  {
    puzzle:   '010020300004005060070000008006900070000800000030007600700000040080500200009040010',
    solution: '815624397394715862672389158246931775951872643138567629763298541487153926529046813',
    level: '⭐⭐ Moyen'
  },
];

function renderSudoku(flat) {
  let out = '';
  for (let r = 0; r < 9; r++) {
    if (r > 0 && r % 3 === 0) out += '┼───────┼───────┼───────┤\n';
    let row = '';
    for (let c = 0; c < 9; c++) {
      if (c > 0 && c % 3 === 0) row += '│';
      const v = flat[r * 9 + c];
      row += ` ${v === '0' ? '·' : v}`;
    }
    out += `│${row} │\n`;
  }
  return '┌───────┬───────┬───────┐\n' + out + '└───────┴───────┴───────┘';
}

// ── LABYRINTHE (génération texto) ─────────────────────────────────────────────
function generateMaze(size = 7) {
  // Génère un labyrinthe simple par récursion (parfait maze)
  const W = size * 2 + 1;
  const H = size * 2 + 1;
  const grid = Array.from({ length: H }, () => Array(W).fill('█'));

  function carve(x, y) {
    const dirs = [[0,-2],[0,2],[-2,0],[2,0]].sort(() => Math.random() - 0.5);
    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (nx > 0 && nx < W-1 && ny > 0 && ny < H-1 && grid[ny][nx] === '█') {
        grid[y + dy/2][x + dx/2] = ' ';
        grid[ny][nx] = ' ';
        carve(nx, ny);
      }
    }
  }
  grid[1][1] = 'S';
  grid[H-2][W-2] = 'E';
  carve(1, 1);

  return grid.map(row => row.join('')).join('\n');
}

// ── REBUS ─────────────────────────────────────────────────────────────────────
const REBUS_LIST = [
  { rebus: '👁️ + 🐝 + 📖', answer: 'Je lis (I – Be – Read)', hint: 'Anglais' },
  { rebus: '🐮 + 🧀 + 💤', answer: 'La Fondue', hint: 'FR' },
  { rebus: '🏠 + 🌿 + 🍳', answer: 'Maison verte (Green house)', hint: 'Anglais' },
  { rebus: '🌊 + 🏠', answer: 'Phare (lighthouse)', hint: 'Anglais' },
  { rebus: '☀️ + 🕊️', answer: 'Paix (Sun + dove = Sunday → Dimanche)', hint: 'FR' },
  { rebus: '🌍 + 🔗', answer: 'Internet', hint: 'FR' },
  { rebus: '💡 + 🏠', answer: 'Phare', hint: 'FR' },
  { rebus: '🐍 + ❤️', answer: 'Serpentin', hint: 'FR' },
];

// ── MOTS CROISÉS MINI ─────────────────────────────────────────────────────────
const CROSSWORDS = [
  {
    theme: 'Informatique',
    grid: [
      '╔═══════╗',
      '║ RESEAU║',
      '║ I   A║',
      '║ CODEM║',
      '║   O  ║',
      '╚═══════╝',
    ],
    clues: {
      horizontal: ['1→ RESEAU (3): Ensemble d\'ordinateurs connectés', '3→ CODE (2): Suite d\'instructions pour un programme'],
      vertical:   ['1↓ RIC: Réseau Inter Connexion', '4↓ MON: Dispositif d\'affichage'],
    },
  },
  {
    theme: 'Nature',
    grid: [
      '╔═══════╗',
      '║ FORET ║',
      '║ L   I ║',
      '║ EAUVÉ ║',
      '║ U   R ║',
      '╚═══════╝',
    ],
    clues: {
      horizontal: ['1→ FORET (3): Grand bois', '3→ EAU (2): Liquide vital'],
      vertical:   ['1↓ FLEUR: Plante colorée', '4↓ RIVER: Cours d\'eau'],
    },
  },
];

// ── KENKEN (variante simplifiée) ──────────────────────────────────────────────
const KENKEN_PUZZLES = [
  {
    size: 4,
    desc: 'Grille 4×4 — Chiffres 1-4, pas de répétition en ligne/colonne',
    cages: [
      '🔲 Cases (1,1)+(1,2) = 5 [+]',
      '🔲 Cases (1,3)+(2,3) = 3 [-]',
      '🔲 Cases (2,1)+(2,2) = 4 [×]',
      '🔲 Cases (3,1)+(4,1) = 2 [÷]',
    ],
    solution: '2 3 4 1\n1 4 2 3\n4 1 3 2\n3 2 1 4',
    puzzle:   '? ? ? ?\n? ? ? ?\n? ? ? ?\n? ? ? ?',
  },
];

// ── EXPORT COMMANDES ──────────────────────────────────────────────────────────

const morse = {
  name: 'morse',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, args } = ctx;
    const sub  = (args[0] || '').toLowerCase();
    const text = args.slice(1).join(' ').trim();

    if (!sub || !text) {
      await antiBan.safeSend(sock, jid, {
        text:
          '📡 *MORSE*\n\n' +
          'Encoder : `.morse enc Bonjour`\n' +
          'Décoder : `.morse dec .... . .-.`\n\n' +
          '`.` = point   `-` = tiret   `/` = espace\n\n' +
          '> *ZERO TRACE BOT v5.0*',
      }, { msgOptions: { quoted: msg } });
      return;
    }

    if (sub === 'enc' || sub === 'encode') {
      const result = textToMorse(text);
      await antiBan.safeSend(sock, jid, {
        text: `📡 *ENCODAGE MORSE*\n\n📝 Texte : ${text}\n\n⚡ Morse :\n\`${result}\`\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    } else if (sub === 'dec' || sub === 'decode') {
      const result = morseToText(text);
      await antiBan.safeSend(sock, jid, {
        text: `📡 *DÉCODAGE MORSE*\n\n⚡ Morse : \`${text}\`\n\n📝 Texte : *${result.toUpperCase()}*\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};

const cipher = {
  name: 'cipher',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, args } = ctx;
    const sub   = (args[0] || '').toLowerCase();
    const shift  = parseInt(args[1]) || 13;
    const text   = args.slice(2).join(' ').trim();

    if (!sub || !text) {
      await antiBan.safeSend(sock, jid, {
        text:
          '🔐 *CIPHER CÉSAR*\n\n' +
          'Encoder : `.cipher enc [décalage] [texte]`\n' +
          'Décoder : `.cipher dec [décalage] [texte]`\n\n' +
          'Ex : `.cipher enc 3 BONJOUR` → ERQMRXU\n' +
          'Ex : `.cipher dec 3 ERQMRXU` → BONJOUR\n\n' +
          'ROT13 = décalage de 13 (symétrique)\n\n' +
          '> *ZERO TRACE BOT v5.0*',
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const result = sub === 'enc' ? caesarEncode(text, shift) : caesarDecode(text, shift);
    await antiBan.safeSend(sock, jid, {
      text:
        `🔐 *CHIFFREMENT CÉSAR*\n\n` +
        `Mode : ${sub === 'enc' ? '🔒 Encodage' : '🔓 Décodage'}\n` +
        `Décalage : +${shift}\n\n` +
        `📥 Entrée : \`${text}\`\n` +
        `📤 Sortie : \`${result}\`\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const sudoku = {
  name: 'sudoku',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, args } = ctx;

    if (args[0] === 'solution') {
      const p = getRandom(SUDOKU_PUZZLES);
      await antiBan.safeSend(sock, jid, {
        text: `✅ *SUDOKU — SOLUTION*\n\n\`\`\`\n${renderSudoku(p.solution)}\n\`\`\`\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const p = getRandom(SUDOKU_PUZZLES);
    await antiBan.safeSend(sock, jid, {
      text:
        `🔢 *SUDOKU ${p.level}*\n\n` +
        `Remplis la grille avec 1-9.\n` +
        `Pas de répétition en ligne, colonne ou bloc 3×3.\n\n` +
        `\`\`\`\n${renderSudoku(p.puzzle)}\n\`\`\`\n\n` +
        `💡 *.sudoku solution* pour voir la réponse\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const maze = {
  name: 'maze',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, args } = ctx;
    const size = Math.min(Math.max(parseInt(args[0]) || 5, 3), 8);
    const grid = generateMaze(size);
    await antiBan.safeSend(sock, jid, {
      text:
        `🌀 *LABYRINTHE ${size}×${size}*\n\n` +
        `S = Départ   E = Arrivée\n\n` +
        `\`\`\`\n${grid}\n\`\`\`\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const rebus = {
  name: 'rebus',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, args } = ctx;
    const r = getRandom(REBUS_LIST);
    const showAnswer = args[0] === 'answer' || args[0] === 'réponse';
    await antiBan.safeSend(sock, jid, {
      text:
        `🧩 *RÉBUS*\n\n` +
        `${r.rebus}\n\n` +
        (showAnswer
          ? `✅ *Réponse :* ${r.answer}`
          : `❓ Que représente cette image ?\n\n💡 *.rebus answer* pour la réponse`) +
        `\n\n> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const crossword = {
  name: 'crossword',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    const cw = getRandom(CROSSWORDS);
    await antiBan.safeSend(sock, jid, {
      text:
        `📰 *MOTS CROISÉS — ${cw.theme}*\n\n` +
        cw.grid.join('\n') + '\n\n' +
        `*Horizontalement :*\n${cw.clues.horizontal.join('\n')}\n\n` +
        `*Verticalement :*\n${cw.clues.vertical.join('\n')}\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const kenken = {
  name: 'kenken',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, args } = ctx;
    const kk = getRandom(KENKEN_PUZZLES);
    const showSol = args[0] === 'solution';
    await antiBan.safeSend(sock, jid, {
      text:
        `🔢 *KENKEN ${kk.size}×${kk.size}*\n\n` +
        `${kk.desc}\n\n` +
        `*Contraintes :*\n${kk.cages.join('\n')}\n\n` +
        (showSol
          ? `✅ *Solution :*\n\`\`\`\n${kk.solution}\n\`\`\``
          : `*Grille :*\n\`\`\`\n${kk.puzzle}\n\`\`\`\n\n💡 *.kenken solution*`) +
        `\n\n> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const puzzle = {
  name: 'puzzle',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    const PUZZLES = [
      { q: "J'ai des villes, mais pas de maisons. Des forêts, mais pas d'arbres. De l'eau, mais pas de poissons. Qu'est-ce que je suis ?", a: "Une carte géographique" },
      { q: "Plus je sèche, plus je suis mouillée. Qu'est-ce que je suis ?", a: "Une serviette" },
      { q: "Je parle sans bouche et j'entends sans oreilles. Je n'ai pas de corps, mais je prends vie avec le vent. Qu'est-ce que je suis ?", a: "Un écho" },
      { q: "Je cours mais n'ai pas de jambes. Je murmure mais n'ai pas de bouche. Qu'est-ce que je suis ?", a: "Un ruisseau" },
      { q: "On me jette quand on a besoin de moi, et on me reprend quand on n'en a plus besoin. Qu'est-ce que je suis ?", a: "Une ancre" },
    ];
    const p = getRandom(PUZZLES);
    await antiBan.safeSend(sock, jid, {
      text:
        `🧩 *PUZZLE LOGIQUE*\n\n` +
        `❓ ${p.q}\n\n` +
        `Réponds avec *.reponse [ta réponse]*\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

module.exports = { morse, cipher, sudoku, maze, rebus, crossword, kenken, puzzle };
