/**
 * ZERO TRACE BOT v5.0 — Moteur de Style Unifié
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Style : Mix Hacker + Animé | Épique | Multilingue
 * Toutes les réponses du bot passent par ce module.
 */

'use strict';

// ── Bordures ASCII thématiques ────────────────────────────────────────────────
const BORDERS = {
  top:    '╔══════════════════════════════╗',
  mid:    '╠══════════════════════════════╣',
  bot:    '╚══════════════════════════════╝',
  thin:   '▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰',
  dashed: '┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄',
  glitch: '▓▒░ ZERO TRACE ░▒▓',
};

// ── Signatures finales tournantes ─────────────────────────────────────────────
const SIGS = [
  '⚡ *ZERO TRACE* — _On ne laisse aucune trace_',
  '💀 *ZERO TRACE v5.0* — _Ghost Mode: ON_',
  '🔮 *ZERO TRACE* — _La matrice obéit_',
  '⚔️ *ZERO TRACE* — _Accès root accordé_',
  '🌐 *ZERO TRACE* — _Signal chiffré. Identité masquée_',
  '🕶️ *ZERO TRACE* — _Fantôme du réseau_',
  '🧬 *ZERO TRACE* — _Système initialisé_',
  '🔥 *ZERO TRACE* — _Puissance maximale_',
];

function sig() {
  return SIGS[Math.floor(Math.random() * SIGS.length)];
}

// ── Icônes par catégorie ──────────────────────────────────────────────────────
const ICONS = {
  success:  '✅', error: '❌', warn: '⚠️', info: 'ℹ️',
  lock:     '🔒', unlock: '🔓', fire: '🔥', skull: '💀',
  hack:     '💻', ghost: '👻', scan: '🔍', ai: '🤖',
  music:    '🎵', image: '🖼️', video: '🎬', sticker: '🎴',
  group:    '👥', admin: '⚔️', owner: '👑', sudo: '🛡️',
  stats:    '📊', timer: '⏱️', prefix: '⚙️', brain: '🧠',
  glitch:   '▓▒░', matrix: '🟩', signal: '📡',
};

// ── Réponses d'erreur permission — style animé/hacker ─────────────────────────
const PERM_ERRORS = [
  `${ICONS.lock} *ACCÈS REFUSÉ*\n╔═ SYSTÈME ═╗\n║ Niveau d'autorisation insuffisant.\n║ Cette commande nécessite les droits *ADMIN*.\n╚═══════════╝`,
  `${ICONS.skull} *INTRUSION BLOQUÉE*\n▓▒░ Ton niveau d'accès ne correspond pas à la commande demandée. ░▒▓\n_Seuls les administrateurs peuvent exécuter ce protocole._`,
  `${ICONS.hack} *PERMISSION DENIED*\n\`\`\`[ZERO TRACE OS]\n$ sudo execute_cmd\nERROR: Access level too low\nRequired: ADMIN | Current: USER\`\`\``,
];

const OWNER_ERRORS = [
  `${ICONS.lock} *ROOT ACCESS ONLY*\n╔═══════════════════╗\n║ ⚠️  ZONE RESTREINTE  ║\n║ Réservé au *Propriétaire*.\n║ Aucune exception.\n╚═══════════════════╝`,
  `${ICONS.skull} *ACCÈS PROPRIÉTAIRE REQUIS*\n▓▒░ Protocole de sécurité activé — seul l'*OWNER* peut franchir cette barrière. ░▒▓`,
];

const GROUP_ONLY = [
  `${ICONS.group} *GROUPES UNIQUEMENT*\n▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\nCette commande ne fonctionne qu'en *groupe*.\nAjoute-moi dans un groupe et réessaie.`,
  `${ICONS.glitch} *CONTEXTE INVALIDE*\n\`\`\`[ZT-OS] Erreur : environnement solo détecté\nCette commande requiert un contexte de groupe.\`\`\``,
];

function randErr(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Builders de messages ──────────────────────────────────────────────────────

/**
 * Box épique avec titre et contenu
 * @param {string} title  — ex: "PING SYSTEM"
 * @param {string} body   — contenu multi-ligne
 * @param {string} [icon] — emoji
 */
function box(title, body, icon = '⚡') {
  return (
    `${icon} *${title}*\n` +
    `${BORDERS.thin}\n` +
    `${body}\n` +
    `${BORDERS.dashed}\n` +
    `> ${sig()}`
  );
}

/**
 * Box succès
 */
function success(title, body) {
  return box(`✅ ${title}`, body, '');
}

/**
 * Box erreur inline (courte)
 */
function err(msg) {
  return `❌ *ERREUR*\n▰▰▰▰▰▰▰▰▰▰\n${msg}\n\n> ${sig()}`;
}

/**
 * Réponse "commande inconnue" avec suggestions
 */
function unknownCmd(prefix, cmdKey, suggestions = []) {
  const sugg = suggestions.length
    ? `\n💡 *Tu voulais dire ?*\n${suggestions.map(s => `  › \`${prefix}${s}\``).join('\n')}\n`
    : '';
  return (
    `${ICONS.glitch} *COMMANDE INCONNUE* \`${prefix}${cmdKey}\`\n` +
    `${BORDERS.thin}\n` +
    `${sugg}\n` +
    `📋 \`${prefix}menu\` → Toutes les commandes\n` +
    `🔍 \`${prefix}help [catégorie]\` → Aide précise\n\n` +
    `> ${sig()}`
  );
}

/**
 * Message de bienvenue
 */
function welcome(name, prefix) {
  return (
    `╔═══════════════════════════════╗\n` +
    `║  ⚡  ZERO TRACE BOT v5.0  ⚡  ║\n` +
    `║   _Ghost Mode : ACTIVATED_    ║\n` +
    `╚═══════════════════════════════╝\n\n` +
    `Bienvenue dans la matrice, *${name}* 👾\n\n` +
    `🔮 Je suis *ZERO TRACE* — bot WhatsApp hacker-grade.\n` +
    `Aucune trace. Puissance maximale.\n\n` +
    `${BORDERS.dashed}\n` +
    `📌 *Commandes de base :*\n` +
    `  › \`${prefix}menu\`  — Arsenal complet\n` +
    `  › \`${prefix}ai\`    — IA multi-provider\n` +
    `  › \`${prefix}myprefix !\` — Ton prefix perso\n` +
    `  › \`${prefix}help\`  — Aide détaillée\n` +
    `${BORDERS.dashed}\n\n` +
    `⚙️ *Ton prefix actuel :* \`${prefix}\`\n\n` +
    `> 💀 _ZERO TRACE — On ne laisse aucune trace_`
  );
}

module.exports = {
  BORDERS, ICONS, SIGS, sig,
  box, success, err, unknownCmd, welcome,
  randErr,
  PERM_ERRORS, OWNER_ERRORS, GROUP_ONLY,
};
