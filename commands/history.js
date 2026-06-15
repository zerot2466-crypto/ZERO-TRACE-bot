/**
 * ZERO TRACE BOT v5.0 — history.js
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Historique des dernières commandes utilisées
 *
 * Commandes :
 *   .history          — mes 10 dernières commandes
 *   .history [n]      — mes n dernières commandes (max 25)
 *   .history clear    — effacer mon historique
 */
'use strict';

const fs   = require('fs-extra');
const path = require('path');

const HISTORY_DIR  = path.join(__dirname, '../data/history');
const BOT_TAG      = '> ⚡ _ZERO TRACE BOT v5.0_';
const MAX_HISTORY  = 50;

fs.ensureDirSync(HISTORY_DIR);

function _histPath(sender) {
  const safe = sender.replace(/[^a-zA-Z0-9@_]/g, '_').slice(0, 60);
  return path.join(HISTORY_DIR, `${safe}.json`);
}

function loadHistory(sender) {
  try { return fs.readJsonSync(_histPath(sender)); } catch { return []; }
}

function saveHistory(sender, entries) {
  try { fs.writeJsonSync(_histPath(sender), entries.slice(-MAX_HISTORY), { spaces: 0 }); } catch {}
}

// Appelé depuis handler.js pour tracker chaque commande
function trackHistory(sender, cmdName, jid) {
  try {
    const h = loadHistory(sender);
    h.push({
      cmd:  cmdName,
      jid:  jid?.endsWith('@g.us') ? 'groupe' : 'DM',
      at:   Date.now(),
    });
    saveHistory(sender, h);
  } catch {}
}

function formatAgo(ts) {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0)  return `il y a ${d}j`;
  if (h > 0)  return `il y a ${h}h`;
  if (m > 0)  return `il y a ${m}min`;
  return 'à l\'instant';
}

module.exports = {
  name:    'history',
  aliases: ['historique', 'cmdhistory', 'mescmds'],
  trackHistory,

  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan, sender } = ctx;

    const sub = (args[0] || '').toLowerCase();

    // ── .history clear ────────────────────────────────────────────────────────
    if (sub === 'clear') {
      try { fs.removeSync(_histPath(sender)); } catch {}
      await antiBan.safeSend(sock, jid, {
        text: '🗑️ Historique effacé.\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .history [n] ──────────────────────────────────────────────────────────
    const count   = Math.min(parseInt(args[0]) || 10, 25);
    const entries = loadHistory(sender);

    if (!entries.length) {
      await antiBan.safeSend(sock, jid, {
        text:
          '📋 *HISTORIQUE*\n\n' +
          'Aucune commande enregistrée pour l\'instant.\n\n' +
          '_(L\'historique se remplit à chaque commande utilisée)_\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const recent = entries.slice(-count).reverse();
    const lines  = recent.map((e, i) =>
      `${i + 1}. .${e.cmd} — _${formatAgo(e.at)}_ (${e.jid})`
    ).join('\n');

    // Stats rapides
    const freq = {};
    entries.forEach(e => { freq[e.cmd] = (freq[e.cmd] || 0) + 1; });
    const topCmd = Object.entries(freq).sort((a,b) => b[1]-a[1])[0];

    await antiBan.safeSend(sock, jid, {
      text:
        `📋 *HISTORIQUE — ${Math.min(count, entries.length)} dernières commandes*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `${lines}\n\n` +
        `📊 Total : ${entries.length} commandes\n` +
        (topCmd ? `⭐ Préférée : .${topCmd[0]} (${topCmd[1]}x)\n` : '') +
        `\n💡 \`.history clear\` pour effacer\n\n` + BOT_TAG,
    }, { msgOptions: { quoted: msg } });
  },
};
