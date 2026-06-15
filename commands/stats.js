/**
 * ZERO TRACE BOT v5.0 — stats.js
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Tableau de bord owner : uptime, RAM, commandes utilisées, users actifs
 *
 * Commandes :
 *   .stats              — tableau de bord complet
 *   .stats reset        — remettre les compteurs à zéro (owner)
 */
'use strict';

const fs   = require('fs-extra');
const path = require('path');
const os   = require('os');

const STATS_FILE = path.join(__dirname, '../data/bot_stats.json');
const BOT_TAG    = '> ⚡ _ZERO TRACE BOT v5.0_';

// ── Démarrage du bot ──────────────────────────────────────────────────────────
if (!global._botStartTime) global._botStartTime = Date.now();

// ── Chargement / sauvegarde ───────────────────────────────────────────────────
function loadStats() {
  try { return fs.readJsonSync(STATS_FILE); } catch {
    return {
      totalCommands: 0,
      commandUsage:  {},
      uniqueUsers:   new Set(),
      uniqueGroups:  new Set(),
      startDate:     new Date().toISOString(),
      lastReset:     null,
    };
  }
}

function saveStats(s) {
  try {
    // Convertir les Set en Array pour JSON
    const toSave = {
      ...s,
      uniqueUsers:  [...(s.uniqueUsers  instanceof Set ? s.uniqueUsers  : new Set(s.uniqueUsers  || []))],
      uniqueGroups: [...(s.uniqueGroups instanceof Set ? s.uniqueGroups : new Set(s.uniqueGroups || []))],
    };
    fs.ensureDirSync(path.dirname(STATS_FILE));
    fs.writeJsonSync(STATS_FILE, toSave, { spaces: 0 });
  } catch (e) { console.error('[STATS] Erreur save:', e.message); }
}

// ── Tracker global (appelé depuis handler.js) ─────────────────────────────────
function trackCommand(cmdName, sender, jid) {
  try {
    const s = loadStats();
    s.totalCommands = (s.totalCommands || 0) + 1;
    s.commandUsage  = s.commandUsage || {};
    s.commandUsage[cmdName] = (s.commandUsage[cmdName] || 0) + 1;

    const users  = new Set(s.uniqueUsers  || []);
    const groups = new Set(s.uniqueGroups || []);
    if (sender) users.add(sender);
    if (jid?.endsWith('@g.us')) groups.add(jid);
    s.uniqueUsers  = users;
    s.uniqueGroups = groups;

    saveStats(s);
  } catch (e) {}
}

// ── Formatage uptime ──────────────────────────────────────────────────────────
function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0)  return `${d}j ${h % 24}h ${m % 60}min`;
  if (h > 0)  return `${h}h ${m % 60}min ${s % 60}s`;
  if (m > 0)  return `${m}min ${s % 60}s`;
  return `${s}s`;
}

// ── COMMANDE ──────────────────────────────────────────────────────────────────
module.exports = {
  name:    'stats',
  aliases: ['botstats'],
  trackCommand,

  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan, isOwner, isSudo, isOwnerContext} = ctx;

    if (!ctx.isOwnerContext) {
      await antiBan.safeSend(sock, jid, {
        text: '🔒 Commande réservée au *propriétaire* et aux *sudos*.\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const sub = (args[0] || '').toLowerCase();

    // ── .stats reset ─────────────────────────────────────────────────────────
    if (sub === 'reset') {
      fs.writeJsonSync(STATS_FILE, {
        totalCommands: 0,
        commandUsage:  {},
        uniqueUsers:   [],
        uniqueGroups:  [],
        startDate:     new Date().toISOString(),
        lastReset:     new Date().toISOString(),
      }, { spaces: 0 });
      global._botStartTime = Date.now();
      await antiBan.safeSend(sock, jid, {
        text: '🔄 Compteurs remis à zéro.\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .stats — tableau de bord ──────────────────────────────────────────────
    const s          = loadStats();
    const uptime     = formatUptime(Date.now() - (global._botStartTime || Date.now()));
    const ramUsed    = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    const ramTotal   = Math.round(os.totalmem() / 1024 / 1024);
    const ramPct     = Math.round((ramUsed / ramTotal) * 100);
    const cpuLoad    = os.loadavg()[0].toFixed(2);
    const nodeVer    = process.version;
    const platform   = os.platform();

    // Top 5 commandes
    const usage      = s.commandUsage || {};
    const top5       = Object.entries(usage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([ cmd, count], i) => `  ${i + 1}. .${cmd} (${count}x)`)
      .join('\n');

    const users  = Array.isArray(s.uniqueUsers)  ? s.uniqueUsers.length  : 0;
    const groups = Array.isArray(s.uniqueGroups) ? s.uniqueGroups.length : 0;
    const since  = s.startDate
      ? new Date(s.startDate).toLocaleDateString('fr-FR')
      : 'N/A';

    // Barre de RAM visuelle
    const barLen  = 12;
    const filled  = Math.round((ramUsed / ramTotal) * barLen);
    const ramBar  = '█'.repeat(filled) + '░'.repeat(barLen - filled);
    const ramIcon = ramPct > 80 ? '🔴' : ramPct > 50 ? '🟡' : '🟢';

    await antiBan.safeSend(sock, jid, {
      text:
        `📊 *ZERO TRACE — DASHBOARD*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `⏱️ Uptime     : *${uptime}*\n` +
        `📅 Actif depuis : ${since}\n\n` +
        `${ramIcon} RAM : ${ramBar} ${ramUsed}MB/${ramTotal}MB (${ramPct}%)\n` +
        `💻 CPU Load   : ${cpuLoad}\n` +
        `🟢 Node.js    : ${nodeVer} | ${platform}\n\n` +
        `📈 *Activité :*\n` +
        `  Commandes totales : *${s.totalCommands || 0}*\n` +
        `  Utilisateurs vus  : *${users}*\n` +
        `  Groupes actifs    : *${groups}*\n\n` +
        (top5 ? `🏆 *Top 5 commandes :*\n${top5}\n\n` : '') +
        `💡 \`.stats reset\` — remettre à zéro\n\n` + BOT_TAG,
    }, { msgOptions: { quoted: msg } });
  },
};
