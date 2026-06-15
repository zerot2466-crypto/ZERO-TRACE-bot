/**
 * ZERO TRACE BOT v5.0 — theme.js
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Changer le style visuel des messages du bot
 *
 * Commandes :
 *   .theme              — voir le thème actuel + liste
 *   .theme [nom]        — changer de thème
 *   .theme preview [nom]— aperçu d'un thème
 */
'use strict';

const fs   = require('fs-extra');
const path = require('path');

const THEME_FILE = path.join(__dirname, '../data/theme.json');

// ── Définition des thèmes ─────────────────────────────────────────────────────
const THEMES = {
  hacker: {
    name:      'Hacker',
    emoji:     '💀',
    separator: '━━━━━━━━━━━━━━━━━━━━━━',
    tag:       '> ⚡ _ZERO TRACE BOT v5.0_',
    bullet:    '▸',
    success:   '✅',
    error:     '❌',
    info:      '🔍',
    corner:    '╔═╗',
    preview:
      '💀 *ZERO TRACE — HACKER*\n' +
      '━━━━━━━━━━━━━━━━━━━━━━\n\n' +
      '▸ Style sombre et technique\n' +
      '▸ Minimaliste et efficace\n\n' +
      '> ⚡ _ZERO TRACE BOT v5.0_',
  },
  matrix: {
    name:      'Matrix',
    emoji:     '🟩',
    separator: '▓▒░░░░░░░░░░░░░░░░░▒▓',
    tag:       '> 🟩 _THE MATRIX HAS YOU_',
    bullet:    '◆',
    success:   '◆',
    error:     '◇',
    info:      '◈',
    corner:    '┌─┐',
    preview:
      '🟩 *ZERO TRACE — MATRIX*\n' +
      '▓▒░░░░░░░░░░░░░░░░░▒▓\n\n' +
      '◆ Follow the white rabbit\n' +
      '◆ There is no spoon\n\n' +
      '> 🟩 _THE MATRIX HAS YOU_',
  },
  minimal: {
    name:      'Minimal',
    emoji:     '◾',
    separator: '─────────────────────',
    tag:       '— Zero Trace',
    bullet:    '·',
    success:   '·',
    error:     '×',
    info:      '·',
    corner:    '',
    preview:
      '◾ Zero Trace\n' +
      '─────────────────────\n\n' +
      '· Style épuré\n' +
      '· Rien de superflu\n\n' +
      '— Zero Trace',
  },
  elite: {
    name:      'Elite',
    emoji:     '👑',
    separator: '◈━━━━━━━━━━━━━━━━━━◈',
    tag:       '> 👑 _ZERO TRACE — ÉLITE_',
    bullet:    '◈',
    success:   '✦',
    error:     '✧',
    info:      '◈',
    corner:    '╔══╗',
    preview:
      '👑 *ZERO TRACE — ELITE*\n' +
      '◈━━━━━━━━━━━━━━━━━━◈\n\n' +
      '◈ Style premium et raffiné\n' +
      '◈ Pour les vrais\n\n' +
      '> 👑 _ZERO TRACE — ÉLITE_',
  },
  ghost: {
    name:      'Ghost',
    emoji:     '👻',
    separator: '· · · · · · · · · · ·',
    tag:       '> 👻 _Ghost Protocol_',
    bullet:    '·',
    success:   '○',
    error:     '●',
    info:      '◌',
    corner:    '',
    preview:
      '👻 *ZERO TRACE — GHOST*\n' +
      '· · · · · · · · · · ·\n\n' +
      '· Silencieux\n' +
      '· Invisible\n\n' +
      '> 👻 _Ghost Protocol_',
  },
  cyber: {
    name:      'Cyber',
    emoji:     '🔷',
    separator: '⟨⟨⟨━━━━━━━━━━━━━━⟩⟩⟩',
    tag:       '> 🔷 _C Y B E R // T R A C E_',
    bullet:    '⟩',
    success:   '⟦✓⟧',
    error:     '⟦✗⟧',
    info:      '⟦i⟧',
    corner:    '⌈ ⌉',
    preview:
      '🔷 *Z E R O T R A C E*\n' +
      '⟨⟨⟨━━━━━━━━━━━━━━⟩⟩⟩\n\n' +
      '⟩ C Y B E R P U N K\n' +
      '⟩ D I G I T A L\n\n' +
      '> 🔷 _C Y B E R // T R A C E_',
  },
};

// ── Gestion ───────────────────────────────────────────────────────────────────
function getTheme() {
  try {
    const d = fs.readJsonSync(THEME_FILE);
    return THEMES[d.current] || THEMES.hacker;
  } catch { return THEMES.hacker; }
}

function setTheme(name) {
  fs.ensureDirSync(path.dirname(THEME_FILE));
  fs.writeJsonSync(THEME_FILE, { current: name }, { spaces: 2 });
}

function getCurrentName() {
  try { return fs.readJsonSync(THEME_FILE).current || 'hacker'; } catch { return 'hacker'; }
}

module.exports = {
  name:    'theme',
  aliases: ['settheme', 'style'],
  getTheme,
  THEMES,

  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan, isOwner, isSudo } = ctx;
    const BOT_TAG = getTheme().tag;

    if (!isOwner && !isSudo) {
      await antiBan.safeSend(sock, jid, {
        text: '🔒 Réservé owner/sudo.\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const sub = (args[0] || '').toLowerCase();

    // ── .theme preview [nom] ──────────────────────────────────────────────────
    if (sub === 'preview') {
      const name = (args[1] || '').toLowerCase();
      const t    = THEMES[name];
      if (!t) {
        await antiBan.safeSend(sock, jid, {
          text: `❌ Thème *${name}* inconnu.\n\nThèmes : ${Object.keys(THEMES).join(', ')}\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        return;
      }
      await antiBan.safeSend(sock, jid, {
        text: `👁️ *Aperçu — ${t.name}*\n\n${t.preview}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .theme [nom] — changer ────────────────────────────────────────────────
    if (sub && THEMES[sub]) {
      setTheme(sub);
      const t = THEMES[sub];
      await antiBan.safeSend(sock, jid, {
        text:
          `${t.emoji} *Thème changé : ${t.name}*\n\n` +
          `${t.preview}\n\n` +
          `> _Redémarre le bot pour que tous les messages utilisent ce thème._`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .theme — voir la liste ────────────────────────────────────────────────
    const current = getCurrentName();
    const list    = Object.entries(THEMES).map(([key, t]) =>
      `${key === current ? '✅' : '◾'} *${t.name}* (\`${key}\`)`
    ).join('\n');

    await antiBan.safeSend(sock, jid, {
      text:
        `🎨 *THÈMES DISPONIBLES*\n${getTheme().separator}\n\n` +
        `${list}\n\n` +
        `Actuel : *${THEMES[current]?.name || current}*\n\n` +
        `Changer : \`.theme [nom]\`\n` +
        `Aperçu  : \`.theme preview [nom]\`\n\n` + BOT_TAG,
    }, { msgOptions: { quoted: msg } });
  },
};
