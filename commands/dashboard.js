/**
 * ZERO TRACE BOT v5.0 — dashboard.js
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Serveur web de monitoring — accessible depuis ton navigateur
 *
 * Commandes :
 *   .dashboard          — voir l'URL du dashboard
 *   .dashboard on       — démarrer le serveur dashboard
 *   .dashboard off      — arrêter le serveur dashboard
 */
'use strict';

const express = require('express');
const path    = require('path');
const os      = require('os');
const fs      = require('fs-extra');

const BOT_TAG = '> ⚡ _ZERO TRACE BOT v5.0_';

let _server   = null;
let _port     = null;

// ── HTML du dashboard ─────────────────────────────────────────────────────────
function getDashboardHTML(stats) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ZERO TRACE BOT — Dashboard</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#0a0a0f;color:#e0e0e0;font-family:'Courier New',monospace;padding:20px}
  .header{text-align:center;padding:30px 0;border-bottom:1px solid #1a1a2e}
  .title{font-size:2em;color:#00ff88;text-shadow:0 0 20px #00ff88;letter-spacing:4px}
  .sub{color:#555;margin-top:8px;font-size:.9em}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:15px;margin-top:25px}
  .card{background:#0f0f1a;border:1px solid #1a1a3e;border-radius:8px;padding:20px}
  .card h3{color:#00ff88;font-size:.8em;letter-spacing:2px;text-transform:uppercase;margin-bottom:15px}
  .stat{display:flex;justify-content:space-between;margin:8px 0;font-size:.9em}
  .stat .val{color:#00d4ff;font-weight:bold}
  .badge{display:inline-block;padding:3px 10px;border-radius:4px;font-size:.75em}
  .ok{background:#00ff8820;color:#00ff88;border:1px solid #00ff8840}
  .ko{background:#ff000020;color:#ff4444;border:1px solid #ff000040}
  .bar-wrap{background:#1a1a2e;border-radius:4px;height:8px;margin-top:5px;overflow:hidden}
  .bar{height:100%;border-radius:4px;background:linear-gradient(90deg,#00ff88,#00d4ff)}
  .cmd-list{max-height:200px;overflow-y:auto}
  .cmd-item{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #1a1a2e;font-size:.85em}
  .cmd-count{color:#00d4ff}
  .footer{text-align:center;margin-top:30px;color:#333;font-size:.75em}
  .refresh{color:#00ff88;cursor:pointer;font-size:.8em;float:right}
</style>
</head>
<body>
<div class="header">
  <div class="title">⚡ ZERO TRACE BOT</div>
  <div class="sub">Dashboard v5.0 — Dernière mise à jour: ${new Date().toLocaleString('fr-FR')}</div>
  <span class="refresh" onclick="location.reload()">↻ Actualiser</span>
</div>

<div class="grid">
  <div class="card">
    <h3>⚡ Statut Système</h3>
    <div class="stat"><span>Statut</span><span class="badge ok">🟢 En ligne</span></div>
    <div class="stat"><span>Uptime</span><span class="val">${stats.uptime}</span></div>
    <div class="stat"><span>Node.js</span><span class="val">${process.version}</span></div>
    <div class="stat"><span>Plateforme</span><span class="val">${os.platform()}</span></div>
    <div class="stat"><span>Actif depuis</span><span class="val">${stats.since}</span></div>
  </div>

  <div class="card">
    <h3>💾 Mémoire RAM</h3>
    <div class="stat"><span>Utilisée</span><span class="val">${stats.ramUsed}MB / ${stats.ramTotal}MB</span></div>
    <div class="bar-wrap"><div class="bar" style="width:${stats.ramPct}%"></div></div>
    <div class="stat" style="margin-top:10px"><span>Heap JS</span><span class="val">${stats.heapUsed}MB</span></div>
    <div class="stat"><span>CPU Load</span><span class="val">${stats.cpuLoad}</span></div>
  </div>

  <div class="card">
    <h3>📊 Activité</h3>
    <div class="stat"><span>Commandes totales</span><span class="val">${stats.totalCommands}</span></div>
    <div class="stat"><span>Utilisateurs</span><span class="val">${stats.uniqueUsers}</span></div>
    <div class="stat"><span>Groupes</span><span class="val">${stats.uniqueGroups}</span></div>
    <div class="stat"><span>Providers IA</span><span class="val">${stats.aiProviders}/6</span></div>
  </div>

  <div class="card">
    <h3>🏆 Top Commandes</h3>
    <div class="cmd-list">
      ${stats.topCmds.map(([cmd, count]) =>
        `<div class="cmd-item"><span>.${cmd}</span><span class="cmd-count">${count}×</span></div>`
      ).join('')}
      ${stats.topCmds.length === 0 ? '<div style="color:#555">Aucune commande utilisée</div>' : ''}
    </div>
  </div>

  <div class="card">
    <h3>🤖 Providers IA</h3>
    ${stats.providers.map(p =>
      `<div class="stat">
        <span>${p.name}</span>
        <span class="badge ${p.hasKey && p.healthy ? 'ok' : 'ko'}">${p.hasKey && p.healthy ? '🟢' : p.hasKey ? '🟡' : '⚫'} ${p.hasKey && p.healthy ? 'OK' : p.hasKey ? 'Pause' : 'N/A'}</span>
      </div>`
    ).join('')}
  </div>
</div>

<div class="footer">
  ZERO TRACE BOT v5.0 — Dashboard auto-refresh toutes les 30s
  <script>setTimeout(()=>location.reload(),30000)</script>
</div>
</body>
</html>`;
}

function startDashboard(port = 4000) {
  if (_server) return _port;

  const app = express();

  app.get('/', (req, res) => {
    try {
      // Stats système
      const uptime   = process.uptime();
      const d        = Math.floor(uptime / 86400);
      const h        = Math.floor((uptime % 86400) / 3600);
      const m        = Math.floor((uptime % 3600) / 60);
      const uptimeStr = d > 0 ? `${d}j ${h}h ${m}min` : h > 0 ? `${h}h ${m}min` : `${m}min`;

      const ramUsed  = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
      const ramTotal = Math.round(os.totalmem() / 1024 / 1024);
      const ramPct   = Math.round((ramUsed / ramTotal) * 100);
      const heapUsed = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
      const cpuLoad  = os.loadavg()[0].toFixed(2);

      // Stats commandes
      let totalCommands = 0, uniqueUsers = 0, uniqueGroups = 0, topCmds = [];
      try {
        const statsData = fs.readJsonSync(path.join(__dirname, '../data/bot_stats.json'));
        totalCommands = statsData.totalCommands || 0;
        uniqueUsers   = (statsData.uniqueUsers || []).length;
        uniqueGroups  = (statsData.uniqueGroups || []).length;
        topCmds = Object.entries(statsData.commandUsage || {}).sort((a,b) => b[1]-a[1]).slice(0, 5);
      } catch {}

      // Providers IA
      let providers = [], aiProviders = 0;
      try {
        const ai = require('../lib/openrouter_ai');
        providers    = ai.getProvidersStatus();
        aiProviders  = providers.filter(p => p.hasKey && p.healthy).length;
      } catch {}

      const since = global._botStartTime
        ? new Date(global._botStartTime).toLocaleString('fr-FR')
        : 'N/A';

      const stats = { uptime: uptimeStr, since, ramUsed, ramTotal, ramPct, heapUsed, cpuLoad, totalCommands, uniqueUsers, uniqueGroups, topCmds, providers, aiProviders };
      res.send(getDashboardHTML(stats));
    } catch (e) {
      res.status(500).send(`Erreur: ${e.message}`);
    }
  });

  // API JSON pour des intégrations externes
  app.get('/api/stats', (req, res) => {
    try {
      const statsData = fs.readJsonSync(path.join(__dirname, '../data/bot_stats.json'));
      res.json({ ok: true, uptime: process.uptime(), ...statsData });
    } catch {
      res.json({ ok: true, uptime: process.uptime() });
    }
  });

  _server = app.listen(port, () => {
    console.log(`[DASHBOARD] 🌐 http://localhost:${port}`);
  });
  _port = port;
  return port;
}

function stopDashboard() {
  if (_server) { _server.close(); _server = null; _port = null; }
}

module.exports = {
  name:    'dashboard',
  aliases: ['dash', 'webui', 'monitor'],
  startDashboard,
  stopDashboard,

  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan, isOwner, isSudo } = ctx;

    if (!isOwner && !isSudo) {
      await antiBan.safeSend(sock, jid, {
        text: '🔒 Réservé owner/sudo.\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const sub  = (args[0] || '').toLowerCase();
    const port = parseInt(args[1]) || 4000;

    if (sub === 'on' || sub === 'start') {
      const p = startDashboard(port);
      await antiBan.safeSend(sock, jid, {
        text:
          `🌐 *Dashboard démarré !*\n\n` +
          `URL locale : \`http://localhost:${p}\`\n\n` +
          `Pour y accéder à distance :\n` +
          `• Utilise \`ngrok http ${p}\` pour un tunnel\n` +
          `• Ou expose le port sur ton serveur\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    if (sub === 'off' || sub === 'stop') {
      stopDashboard();
      await antiBan.safeSend(sock, jid, {
        text: '🔴 Dashboard arrêté.\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const running = !!_server;
    await antiBan.safeSend(sock, jid, {
      text:
        `🌐 *DASHBOARD*\n━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `État : ${running ? `🟢 Actif sur le port ${_port}` : '🔴 Inactif'}\n\n` +
        `\`.dashboard on [port]\` — démarrer (défaut: 4000)\n` +
        `\`.dashboard off\` — arrêter\n\n` + BOT_TAG,
    }, { msgOptions: { quoted: msg } });
  },
};
