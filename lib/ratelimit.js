/**
 * ZERO TRACE BOT v5.0 — Rate Limiter (Anti-Spam Commandes)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * RÈGLE :
 *   - Max 2 commandes par fenêtre de 30 secondes par utilisateur
 *   - Au-delà : blocage + message d'avertissement (1 seul par session)
 *   - Après la fenêtre : le compteur repart à zéro automatiquement
 *
 * EXEMPTIONS (pas de limite) :
 *   - Owner et Sudos
 *   - Commandes vitales : .ping, .alive, .help, .menu, .pair
 *
 * CONFIG .env :
 *   RATELIMIT_MAX=2          → max commandes par fenêtre (défaut: 2)
 *   RATELIMIT_WINDOW_MS=30000 → durée de la fenêtre en ms (défaut: 30s)
 *   RATELIMIT_ENABLED=true   → activer/désactiver (défaut: true)
 */

'use strict';

// ── Config depuis .env ────────────────────────────────────────────────────────
const MAX_CMDS      = parseInt(process.env.RATELIMIT_MAX)       || 5;      // 5 cmds max (configurable)
const WINDOW_MS     = parseInt(process.env.RATELIMIT_WINDOW_MS) || 20000;  // par 20s (configurable)
const ENABLED       = process.env.RATELIMIT_ENABLED !== 'false';           // activé par défaut

// Commandes exemptées du rate limit
const EXEMPT_CMDS = new Set([
  'ping', 'alive', 'uptime', 'status',
  'help', 'menu', 'aide',
  'pair', 'connecter', 'lier',
  'info', 'myid', 'start', 'about',
]);

// ── Stockage en mémoire (Map par sender JID) ─────────────────────────────────
// Structure : Map<senderJid, { count: number, windowStart: number, warned: boolean }>
const userWindows = new Map();

// Nettoyage automatique toutes les 2 minutes pour éviter les fuites mémoire
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, data] of userWindows.entries()) {
    if (now - data.windowStart > WINDOW_MS * 2) {
      userWindows.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) console.log(`[RATELIMIT] Nettoyage: ${cleaned} entrées supprimées`);
}, 120000);

/**
 * Vérifie si un utilisateur peut exécuter une commande.
 *
 * @param {string} senderJid    - JID de l'expéditeur
 * @param {string} cmdKey       - Nom de la commande (sans préfixe)
 * @param {boolean} isOwner     - Est-ce l'owner ?
 * @param {boolean} isSudo      - Est-ce un sudo ?
 *
 * @returns {{ allowed: boolean, remaining: number, resetIn: number, firstOffense: boolean }}
 *   - allowed      : true si la commande est autorisée
 *   - remaining    : commandes restantes dans la fenêtre
 *   - resetIn      : ms avant reset de la fenêtre
 *   - firstOffense : true si c'est la première fois qu'on bloque cet utilisateur dans cette fenêtre
 */
function checkRateLimit(senderJid, cmdKey, isOwner = false, isSudo = false) {
  // Désactivé ou exempté
  if (!ENABLED)                         return { allowed: true, remaining: MAX_CMDS, resetIn: 0, firstOffense: false };
  if (isOwner || isSudo)                return { allowed: true, remaining: MAX_CMDS, resetIn: 0, firstOffense: false };
  if (EXEMPT_CMDS.has(cmdKey?.toLowerCase())) return { allowed: true, remaining: MAX_CMDS, resetIn: 0, firstOffense: false };

  const now = Date.now();
  const key = senderJid;

  let data = userWindows.get(key);

  // Première commande ou fenêtre expirée → reset
  if (!data || (now - data.windowStart) >= WINDOW_MS) {
    data = { count: 0, windowStart: now, warned: false };
    userWindows.set(key, data);
  }

  const resetIn   = WINDOW_MS - (now - data.windowStart);
  const remaining = Math.max(0, MAX_CMDS - data.count - 1);

  // Limite atteinte
  if (data.count >= MAX_CMDS) {
    const firstOffense = !data.warned;
    data.warned = true;
    userWindows.set(key, data);
    return { allowed: false, remaining: 0, resetIn, firstOffense };
  }

  // OK — incrémenter
  data.count++;
  userWindows.set(key, data);

  return { allowed: true, remaining, resetIn, firstOffense: false };
}

/**
 * Formater le temps restant de manière lisible.
 * Ex: 25340ms → "25 secondes"
 */
function formatResetTime(ms) {
  const secs = Math.ceil(ms / 1000);
  if (secs < 60) return `${secs} seconde${secs > 1 ? 's' : ''}`;
  const mins = Math.ceil(secs / 60);
  return `${mins} minute${mins > 1 ? 's' : ''}`;
}

/**
 * Construire le message de blocage à envoyer à l'utilisateur.
 * Affiché UNIQUEMENT la première fois (firstOffense = true).
 */
function buildBlockMessage(resetIn, cmdKey, prefix = '.') {
  const time = formatResetTime(resetIn);
  const bars = '▓'.repeat(Math.max(1, Math.ceil((WINDOW_MS - resetIn) / (WINDOW_MS / 10))));
  const empty = '░'.repeat(10 - bars.length);

  const sigList = [
    '💀 ZERO TRACE — Ghost Mode: ON',
    '⚡ ZERO TRACE — Signal chiffré',
    '🔮 ZERO TRACE — La matrice obéit',
  ];
  const randomSig = sigList[Math.floor(Math.random() * sigList.length)];

  return (
    `\`\`\`[ZT-OS] RATE LIMIT ACTIVÉ\n` +
    `Commande : .${cmdKey}\n` +
    `Statut   : BLOQUÉE TEMPORAIREMENT\n` +
    `Reset    : dans ${time}\`\`\`\n\n` +
    `[${bars}${empty}] *${MAX_CMDS}/${MAX_CMDS}*\n\n` +
    `💡 Max *${MAX_CMDS} commandes* / *${Math.ceil(WINDOW_MS / 1000)}s* — Anti-spam activé.\n\n` +
    `> ${randomSig}`
  );
}

/**
 * Réinitialiser manuellement la fenêtre d'un utilisateur (commande .resetrl)
 * Utilisé par l'owner pour débloquer quelqu'un.
 */
function resetUser(senderJid) {
  const existed = userWindows.has(senderJid);
  userWindows.delete(senderJid);
  return existed;
}

/**
 * Statistiques globales (pour .rlstats owner)
 */
function getStats() {
  const now = Date.now();
  const active = [...userWindows.entries()].filter(([, d]) => (now - d.windowStart) < WINDOW_MS);
  const blocked = active.filter(([, d]) => d.count >= MAX_CMDS);
  return {
    totalTracked:  userWindows.size,
    activeWindows: active.length,
    blockedUsers:  blocked.length,
    config: { maxCmds: MAX_CMDS, windowMs: WINDOW_MS, enabled: ENABLED },
  };
}

module.exports = {
  checkRateLimit,
  buildBlockMessage,
  resetUser,
  getStats,
  formatResetTime,
  MAX_CMDS,
  WINDOW_MS,
  ENABLED,
  EXEMPT_CMDS,
};
