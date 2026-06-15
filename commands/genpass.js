/**
 * ZERO TRACE BOT v5.0 — genpass.js
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Générateur de mots de passe avancé avec score d'entropie
 *
 * Commandes :
 *   .genpass                    — 1 mot de passe 16 chars (défaut)
 *   .genpass [longueur]         — longueur custom (8-128)
 *   .genpass [longueur] [n]     — générer n mots de passe
 *   .genpass phrase             — passphrase mémorable (4 mots)
 *   .genpass phrase [n_mots]    — passphrase avec n mots
 *   .genpass pin [longueur]     — PIN numérique
 */
'use strict';
const zts = require('../lib/ztStyle');

const crypto  = require('crypto');
const BOT_TAG = '> ⚡ _ZERO TRACE BOT v5.0_';

// ── Jeux de caractères ────────────────────────────────────────────────────────
const CHARS = {
  lower:   'abcdefghijklmnopqrstuvwxyz',
  upper:   'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits:  '0123456789',
  symbols: '!@#$%^&*()-_=+[]{}|;:,.<>?',
  // Caractères ambigus retirés : 0, O, l, 1, I
  safe:    'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789',
};

// ── Liste de mots pour passphrase ─────────────────────────────────────────────
const WORDS = [
  'soleil','lune','étoile','montagne','rivière','forêt','nuage','pierre','feu','vent',
  'ombre','lumière','dragon','phénix','tigre','aigle','loup','renard','cerf','corbeau',
  'cyber','hack','code','data','pixel','byte','réseau','serveur','clé','vault',
  'acier','diamant','rubis','saphir','onyx','granite','cobra','falcon','ninja','ghost',
  'nexus','sigma','alpha','omega','delta','zéro','trace','shadow','storm','blaze',
  'frozen','razor','swift','thunder','silent','dark','bright','steel','iron','gold',
];

// ── Calcul entropie ────────────────────────────────────────────────────────────
function calcEntropy(password) {
  const chars = new Set(password).size;
  const poolSize = chars * 4; // estimation approximative du pool
  return Math.round(password.length * Math.log2(Math.max(poolSize, 10)));
}

function entropyRating(bits) {
  if (bits >= 128) return { icon: '🔒', label: 'Excellent', color: 'très fort' };
  if (bits >= 80)  return { icon: '🟢', label: 'Fort',      color: 'fort' };
  if (bits >= 60)  return { icon: '🟡', label: 'Moyen',     color: 'moyen' };
  if (bits >= 40)  return { icon: '🟠', label: 'Faible',    color: 'faible' };
  return              { icon: '🔴', label: 'Très faible', color: 'très faible' };
}

// ── Générateur cryptographiquement sûr ────────────────────────────────────────
function generatePassword(length, options = {}) {
  const {
    useLower   = true,
    useUpper   = true,
    useDigits  = true,
    useSymbols = true,
    safe       = false,
  } = options;

  let pool = '';
  const required = [];

  if (safe) {
    pool = CHARS.safe;
  } else {
    if (useLower)   { pool += CHARS.lower;   required.push(CHARS.lower[crypto.randomInt(CHARS.lower.length)]); }
    if (useUpper)   { pool += CHARS.upper;   required.push(CHARS.upper[crypto.randomInt(CHARS.upper.length)]); }
    if (useDigits)  { pool += CHARS.digits;  required.push(CHARS.digits[crypto.randomInt(CHARS.digits.length)]); }
    if (useSymbols) { pool += CHARS.symbols; required.push(CHARS.symbols[crypto.randomInt(CHARS.symbols.length)]); }
  }

  if (!pool) pool = CHARS.lower + CHARS.upper + CHARS.digits;

  // Remplir le reste aléatoirement
  const remaining = length - required.length;
  const chars     = Array.from({ length: Math.max(0, remaining) }, () =>
    pool[crypto.randomInt(pool.length)]
  );

  // Mélanger (Fisher-Yates)
  const all = [...required, ...chars];
  for (let i = all.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [all[i], all[j]] = [all[j], all[i]];
  }

  return all.join('');
}

function generatePassphrase(wordCount = 4) {
  const words = Array.from({ length: wordCount }, () =>
    WORDS[crypto.randomInt(WORDS.length)]
  );
  // Ajouter un chiffre et un symbole pour plus de solidité
  const num  = crypto.randomInt(100);
  const syms = ['!', '@', '#', '$', '-', '_'];
  const sym  = syms[crypto.randomInt(syms.length)];
  return `${words.join('-')}${sym}${num}`;
}

function generatePIN(length = 6) {
  return Array.from({ length }, () => crypto.randomInt(10)).join('');
}

// ── COMMANDE ──────────────────────────────────────────────────────────────────
module.exports = {
  name:    'genpass',
  aliases: ['passgen', 'password', 'mdp', 'genpwd'],

  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan } = ctx;
    const sub = (args[0] || '').toLowerCase();

    // ── .genpass phrase [n] ───────────────────────────────────────────────────
    if (sub === 'phrase' || sub === 'passphrase') {
      const wordCount = Math.min(parseInt(args[1]) || 4, 8);
      const count     = 3;
      const phrases   = Array.from({ length: count }, () => generatePassphrase(wordCount));
      const entropy   = calcEntropy(phrases[0]);
      const rating    = entropyRating(entropy);

      await antiBan.safeSend(sock, jid, {
        text:
          `\`\`\`[ZT-CRYPT] Passphrases générées (${wordCount} mots)
${phrases.map((p, i) => `${i+1}. ${p}`).join('\n')}

Entropie : ~${entropy} bits — ${rating.label}\`\`\`

> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .genpass pin [longueur] ───────────────────────────────────────────────
    if (sub === 'pin') {
      const len  = Math.min(Math.max(parseInt(args[1]) || 6, 4), 12);
      const pins = Array.from({ length: 5 }, () => generatePIN(len));
      await antiBan.safeSend(sock, jid, {
        text:
          `\`\`\`[ZT-CRYPT] PINs générés (${len} chiffres)
${pins.map((p, i) => `${i+1}. ${p}`).join('\n')}\`\`\`` +
          `\n\n⚠️ Un PIN seul est faible — utilise-le avec 2FA\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .genpass [longueur] [n] ───────────────────────────────────────────────
    const length = Math.min(Math.max(parseInt(args[0]) || 16, 8), 128);
    const count  = Math.min(parseInt(args[1]) || 1, 10);

    const passwords = Array.from({ length: count }, () =>
      generatePassword(length, {
        useLower:   true,
        useUpper:   true,
        useDigits:  true,
        useSymbols: true,
      })
    );

    const entropy = calcEntropy(passwords[0]);
    const rating  = entropyRating(entropy);

    // Affichage
    let text =
      `🔐 *MOT DE PASSE${count > 1 ? 'S' : ''} (${length} chars)*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (count === 1) {
      const pw = passwords[0];
      // Analyse des composants
      const hasLower   = /[a-z]/.test(pw);
      const hasUpper   = /[A-Z]/.test(pw);
      const hasDigit   = /[0-9]/.test(pw);
      const hasSymbol  = /[^a-zA-Z0-9]/.test(pw);

      text +=
        `\`${pw}\`\n\n` +
        `${rating.icon} *${rating.label}* — ${entropy} bits d'entropie\n\n` +
        `  ${hasLower  ? '✅' : '❌'} Minuscules\n` +
        `  ${hasUpper  ? '✅' : '❌'} Majuscules\n` +
        `  ${hasDigit  ? '✅' : '❌'} Chiffres\n` +
        `  ${hasSymbol ? '✅' : '❌'} Symboles\n`;
    } else {
      text += passwords.map((p, i) => `${i + 1}. \`${p}\``).join('\n');
      text += `\n\n${rating.icon} ${rating.label} — ~${entropy} bits chacun`;
    }

    text +=
      `\n\n💡 Commandes :\n` +
      `  \`.genpass 32\` — 32 chars\n` +
      `  \`.genpass 20 5\` — 5 mots de passe\n` +
      `  \`.genpass phrase\` — passphrase mémorable\n` +
      `  \`.genpass pin 6\` — PIN numérique\n\n` + BOT_TAG;

    await antiBan.safeSend(sock, jid, { text }, { msgOptions: { quoted: msg } });
  },
};
